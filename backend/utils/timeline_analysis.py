import json
import re
from typing import Any

from services.openrouter_client import call_openrouter


def _extract_json(text: str) -> dict[str, Any]:
    match = re.search(r"\{.*\}", text, flags=re.S)
    if not match:
        return {}
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return {}


async def generate_timeline_impact(decision: str, conversation_history: list[dict[str, str]]) -> dict[str, Any]:
    prompt = (
        f"Decision: {decision}\n"
        "Provide impact timeline for immediate, short-term, medium-term, and long-term.\n"
        "Return valid JSON only with keys: immediate, shortTerm, mediumTerm, longTerm."
    )
    response = await call_openrouter(
        system="You are a timeline analysis expert. Return strict JSON.",
        agent_name="synthesis",
        messages=[*conversation_history[-10:], {"role": "user", "content": prompt}],
        max_tokens=900,
    )
    return _extract_json(response["content"])
