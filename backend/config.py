import os

from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
# Default: OpenRouter free/cheap tier friendly — override in .env if needed
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-3.5-turbo")
APP_ENV = os.getenv("APP_ENV", "development")

CORS_ALLOW_ORIGINS = [o.strip() for o in os.getenv("CORS_ALLOW_ORIGINS", "*").split(",") if o.strip()]
RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))

# Optional per-agent overrides (all default to shared credentials).
AGENT_KEYS = {
    "breakdown": os.getenv("OPENROUTER_API_KEY_BREAKDOWN", OPENROUTER_API_KEY),
    "research": os.getenv("OPENROUTER_API_KEY_RESEARCH", OPENROUTER_API_KEY),
    "framework": os.getenv("OPENROUTER_API_KEY_FRAMEWORK", OPENROUTER_API_KEY),
    "redTeam": os.getenv("OPENROUTER_API_KEY_REDTEAM", OPENROUTER_API_KEY),
    "synthesis": os.getenv("OPENROUTER_API_KEY_SYNTHESIS", OPENROUTER_API_KEY),
    "explainer": os.getenv("OPENROUTER_API_KEY_EXPLAINER", OPENROUTER_API_KEY),
    "comparison": os.getenv("OPENROUTER_API_KEY_COMPARISON", OPENROUTER_API_KEY),
}

AGENT_MODELS = {
    "breakdown": os.getenv("OPENROUTER_MODEL_BREAKDOWN", OPENROUTER_MODEL),
    "research": os.getenv("OPENROUTER_MODEL_RESEARCH", OPENROUTER_MODEL),
    "framework": os.getenv("OPENROUTER_MODEL_FRAMEWORK", OPENROUTER_MODEL),
    "redTeam": os.getenv("OPENROUTER_MODEL_REDTEAM", OPENROUTER_MODEL),
    "synthesis": os.getenv("OPENROUTER_MODEL_SYNTHESIS", OPENROUTER_MODEL),
    "explainer": os.getenv("OPENROUTER_MODEL_EXPLAINER", OPENROUTER_MODEL),
    "comparison": os.getenv("OPENROUTER_MODEL_COMPARISON", OPENROUTER_MODEL),
}
