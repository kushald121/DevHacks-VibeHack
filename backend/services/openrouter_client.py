from typing import Any

import httpx

from config import AGENT_KEYS, AGENT_MODELS, OPENROUTER_API_KEY, OPENROUTER_MODEL


class OpenRouterError(Exception):
    pass


async def call_openrouter(
    *,
    system: str,
    messages: list[dict[str, str]],
    agent_name: str | None = None,
    max_tokens: int = 1800,
) -> dict[str, Any]:
    key = AGENT_KEYS.get(agent_name or "", OPENROUTER_API_KEY)
    model = AGENT_MODELS.get(agent_name or "", OPENROUTER_MODEL)

    if not key:
        raise OpenRouterError("OPENROUTER_API_KEY is not configured.")

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    # Primary model from env; fallbacks if quota/invalid model (OpenRouter)
    models_to_try = [model, "openai/gpt-3.5-turbo", "openai/gpt-4o-mini"]

    response = None
    for selected_model in models_to_try:
        payload = {
            "model": selected_model,
            "messages": [{"role": "system", "content": system}, *messages],
            "max_tokens": max_tokens,
            "temperature": 0.4,
        }
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
            )
        if response.status_code < 400:
            break
        if response.status_code == 400 and "model identifier is invalid" in response.text.lower():
            continue
        break

    if response is None or response.status_code >= 400:
        raise OpenRouterError(f"OpenRouter error {response.status_code}: {response.text}")

    data = response.json()
    return {
        "content": data["choices"][0]["message"]["content"],
        "input_tokens": data.get("usage", {}).get("prompt_tokens", 0),
        "output_tokens": data.get("usage", {}).get("completion_tokens", 0),
    }
