from dataclasses import dataclass, field
from time import time
from typing import Any


@dataclass
class ConversationManager:
    history: list[dict[str, Any]] = field(default_factory=list)
    total_tokens: int = 0

    def add_user_message(self, content: str) -> None:
        self.history.append(
            {
                "role": "user",
                "content": content,
                "timestamp": int(time() * 1000),
            }
        )

    def add_agent_message(self, agent: str, content: str, tokens: int) -> None:
        self.history.append(
            {
                "role": "assistant",
                "content": content,
                "metadata": {
                    "agent": agent,
                    "tokens": tokens,
                    "timestamp": int(time() * 1000),
                },
            }
        )
        self.total_tokens += tokens

    def export_for_model(self) -> list[dict[str, str]]:
        return [{"role": m["role"], "content": m["content"]} for m in self.history]

    def export_state(self) -> dict[str, Any]:
        return {
            "history": self.history,
            "total_tokens": self.total_tokens,
            "timestamp": int(time() * 1000),
        }

    def import_state(self, state: dict[str, Any]) -> None:
        self.history = state.get("history", [])
        self.total_tokens = int(state.get("total_tokens", 0))
