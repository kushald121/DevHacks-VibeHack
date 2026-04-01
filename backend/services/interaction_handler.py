from agents.agent_orchestrator import AgentOrchestrator


class InteractionHandler:
    def __init__(self, orchestrator: AgentOrchestrator):
        self.orchestrator = orchestrator

    async def handle_user_refinement(self, agent_name: str, user_feedback: str):
        self.orchestrator.conversation.add_user_message(
            f"Regarding the {agent_name} output: {user_feedback}"
        )
        return await self.orchestrator.execute_agent(agent_name)

    async def handle_node_click(self, node_id: str, confidence: int):
        prompt = (
            f'Explain detailed reasoning behind "{node_id}" branch. '
            f"Why confidence is {confidence}%, key risks, and what changes recommendation."
        )
        self.orchestrator.conversation.add_user_message(prompt)
        return await self.orchestrator.execute_agent("explainer")

    async def handle_scenario_simulation(self, scenario: str):
        self.orchestrator.conversation.add_user_message(
            f"Simulate scenario: {scenario}. Update recommendation and flowchart."
        )
        return await self.orchestrator.execute_agent("synthesis")

    async def handle_comparison(self, option_a: str, option_b: str):
        self.orchestrator.conversation.add_user_message(
            f"Compare options side-by-side. Option A: {option_a}. Option B: {option_b}."
        )
        return await self.orchestrator.execute_agent("comparison")
