from typing import Any, Callable

from agents.agent_prompts import agent_prompts
from services.conversation_manager import ConversationManager
from services.demo_mode import demo_responses
from services.openrouter_client import call_openrouter
from utils.scoring import assess_risk_level, calculate_confidence


class AgentOrchestrator:
    def __init__(self, conversation: ConversationManager, on_progress: Callable[[dict[str, Any]], None] | None = None):
        self.conversation = conversation
        self.on_progress = on_progress or (lambda _: None)
        self.agent_outputs: dict[str, str] = {}

    async def run_workflow(self, user_input: str, *, demo_scenario: str | None = None) -> dict[str, Any]:
        self.conversation.add_user_message(user_input)
        for agent_name in ["breakdown", "research", "framework", "redTeam", "synthesis"]:
            await self.execute_agent(agent_name, demo_scenario=demo_scenario)
        confidence = calculate_confidence(self.agent_outputs)
        risk = assess_risk_level(self.agent_outputs.get("redTeam", ""))
        return {
            "outputs": self.agent_outputs,
            "confidence": confidence,
            "riskLevel": risk,
            "totalTokens": self.conversation.total_tokens,
            "history": self.conversation.history,
        }

    async def run_workflow_stream(self, user_input: str, *, demo_scenario: str | None = None):
        self.conversation.add_user_message(user_input)
        for agent_name in ["breakdown", "research", "framework", "redTeam", "synthesis"]:
            yield {"type": "agent_start", "agent": agent_name}
            result = await self.execute_agent(agent_name, demo_scenario=demo_scenario)
            yield {"type": "agent_complete", "agent": agent_name, "content": result["content"], "tokens": result["tokens"]}

        confidence = calculate_confidence(self.agent_outputs)
        risk = assess_risk_level(self.agent_outputs.get("redTeam", ""))
        yield {
            "type": "workflow_complete",
            "confidence": confidence,
            "riskLevel": risk,
            "totalTokens": self.conversation.total_tokens,
        }

    async def execute_agent(self, agent_name: str, *, demo_scenario: str | None = None) -> dict[str, Any]:
        self.on_progress({"agent": agent_name, "status": "running"})
        content = ""
        tokens = 0

        if demo_scenario and demo_scenario in demo_responses and agent_name in demo_responses[demo_scenario]:
            content = demo_responses[demo_scenario][agent_name]
        else:
            max_tokens_map = {
                "breakdown": 350,
                "research": 500,
                "framework": 500,
                "redTeam": 450,
                "synthesis": 700,
                "explainer": 400,
                "comparison": 500,
            }
            response = await call_openrouter(
                system=agent_prompts.get(agent_name, "You are a helpful assistant."),
                agent_name=agent_name,
                messages=[
                    *self.conversation.export_for_model()[-10:],
                    {"role": "user", "content": self.get_agent_instruction(agent_name)},
                ],
                max_tokens=max_tokens_map.get(agent_name, 500),
            )
            content = response["content"]
            tokens = response["input_tokens"] + response["output_tokens"]

        self.agent_outputs[agent_name] = content
        self.conversation.add_agent_message(agent_name, content, tokens)
        self.on_progress({"agent": agent_name, "status": "complete", "tokens": tokens})
        return {"agent": agent_name, "content": content, "tokens": tokens}

    @staticmethod
    def get_agent_instruction(agent_name: str) -> str:
        instructions = {
            "breakdown": "Break down this decision into key sub-decisions and factors.",
            "research": "Research relevant data and trends; include source links when possible.",
            "framework": "Apply decision frameworks and confidence scoring.",
            "redTeam": "Challenge assumptions and identify hidden risks.",
            "synthesis": "Synthesize all analysis into final recommendation and Mermaid flowchart.",
            "explainer": "Explain the requested branch in detail with confidence and risk.",
            "comparison": "Compare the provided options side by side.",
        }
        return instructions.get(agent_name, "Provide your best analysis.")
