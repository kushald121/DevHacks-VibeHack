import re


def _keyword_count(text: str, keywords: list[str]) -> int:
    lowered = text.lower()
    total = 0
    for kw in keywords:
        total += len(re.findall(re.escape(kw), lowered))
    return total


def assess_risk_level(red_team_output: str) -> str:
    risk_keywords = ["danger", "risk", "threat", "warning", "fail", "loss", "downside", "concern"]
    count = _keyword_count(red_team_output, risk_keywords)
    if count > 15:
        return "high"
    if count > 7:
        return "medium"
    return "low"


def calculate_confidence(agent_outputs: dict[str, str]) -> int:
    research_score = min(1.0, max(0.2, len(agent_outputs.get("research", "")) / 1200))
    framework_score = min(1.0, max(0.2, len(agent_outputs.get("framework", "")) / 1200))
    risk_penalty = 0.25 if assess_risk_level(agent_outputs.get("redTeam", "")) == "high" else 0.1
    consensus = 0.8 if agent_outputs.get("synthesis") else 0.5
    confidence = (research_score * 0.3) + (framework_score * 0.3) + ((1 - risk_penalty) * 0.2) + (consensus * 0.2)
    return round(confidence * 100)
