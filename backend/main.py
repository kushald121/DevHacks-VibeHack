import json
import time
import uuid

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import StreamingResponse

from agents.agent_orchestrator import AgentOrchestrator
from config import CORS_ALLOW_ORIGINS, OPENROUTER_API_KEY, RATE_LIMIT_PER_MINUTE
from schemas import (
    CompareRequest,
    NodeExplainRequest,
    RefineRequest,
    RunWorkflowRequest,
    RunWorkflowStreamRequest,
    ScenarioRequest,
    SessionStateRequest,
    TimelineRequest,
)
from services.conversation_manager import ConversationManager
from services.interaction_handler import InteractionHandler
from services.openrouter_client import OpenRouterError
from utils.timeline_analysis import generate_timeline_impact

app = FastAPI(title="DevHack Decision Engine Backend")

sessions: dict[str, AgentOrchestrator] = {}
rate_buckets: dict[str, list[float]] = {}


app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS if CORS_ALLOW_ORIGINS != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_context(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    started = time.time()

    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    window_start = now - 60.0
    bucket = rate_buckets.setdefault(client_ip, [])
    bucket[:] = [t for t in bucket if t >= window_start]
    if len(bucket) >= RATE_LIMIT_PER_MINUTE:
        return JSONResponse(
            status_code=429,
            content={"error": {"code": "RATE_LIMITED", "message": "Too many requests. Try again in a minute."}},
            headers={"x-request-id": request_id},
        )
    bucket.append(now)

    response = await call_next(request)
    response.headers["x-request-id"] = request_id
    response.headers["x-response-time-ms"] = str(int((time.time() - started) * 1000))
    return response


@app.exception_handler(OpenRouterError)
async def openrouter_error_handler(request: Request, exc: OpenRouterError):
    return JSONResponse(
        status_code=502,
        content={"error": {"code": "OPENROUTER_ERROR", "message": str(exc)}},
    )


def get_orchestrator(session_id: str) -> AgentOrchestrator:
    if session_id not in sessions:
        sessions[session_id] = AgentOrchestrator(ConversationManager())
    return sessions[session_id]


@app.get("/")
def root():
    return {"service": "decision-backend", "status": "ok"}


@app.get("/health")
def health():
    return {"ok": True, "openrouterConfigured": bool(OPENROUTER_API_KEY)}


@app.post("/api/decision/run")
async def run_workflow(payload: RunWorkflowRequest):
    try:
        orchestrator = get_orchestrator(payload.session_id)
        return await orchestrator.run_workflow(payload.input, demo_scenario=payload.demo_scenario)
    except OpenRouterError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.post("/api/decision/run-stream")
async def run_workflow_stream(payload: RunWorkflowStreamRequest):
    orchestrator = get_orchestrator(payload.session_id)

    async def event_gen():
        async for event in orchestrator.run_workflow_stream(payload.input, demo_scenario=payload.demo_scenario):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(event_gen(), media_type="text/event-stream")


@app.post("/api/decision/refine")
async def refine(payload: RefineRequest):
    try:
        orchestrator = get_orchestrator(payload.session_id)
        handler = InteractionHandler(orchestrator)
        result = await handler.handle_user_refinement(payload.agent_name, payload.feedback)
        return {"result": result, "history": orchestrator.conversation.history}
    except OpenRouterError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/decision/node-explain")
async def node_explain(payload: NodeExplainRequest):
    try:
        orchestrator = get_orchestrator(payload.session_id)
        handler = InteractionHandler(orchestrator)
        result = await handler.handle_node_click(payload.node_id, payload.confidence)
        return {"result": result}
    except OpenRouterError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/decision/simulate")
async def simulate(payload: ScenarioRequest):
    try:
        orchestrator = get_orchestrator(payload.session_id)
        handler = InteractionHandler(orchestrator)
        result = await handler.handle_scenario_simulation(payload.scenario)
        return {"result": result}
    except OpenRouterError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/decision/compare")
async def compare(payload: CompareRequest):
    try:
        orchestrator = get_orchestrator(payload.session_id)
        handler = InteractionHandler(orchestrator)
        result = await handler.handle_comparison(payload.option_a, payload.option_b)
        return {"result": result}
    except OpenRouterError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/decision/timeline")
async def timeline(payload: TimelineRequest):
    try:
        orchestrator = get_orchestrator(payload.session_id)
        data = await generate_timeline_impact(payload.decision, orchestrator.conversation.export_for_model())
        return {"timeline": data}
    except OpenRouterError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/session/{session_id}")
def get_session(session_id: str):
    orchestrator = get_orchestrator(session_id)
    return {
        "session_id": session_id,
        "state": orchestrator.conversation.export_state(),
        "agentOutputs": orchestrator.agent_outputs,
    }


@app.post("/api/session/import")
def import_session(payload: SessionStateRequest):
    orchestrator = get_orchestrator(payload.session_id)
    orchestrator.conversation.import_state(payload.state)
    return {"ok": True}


@app.delete("/api/session/{session_id}")
def reset_session(session_id: str):
    if session_id in sessions:
        del sessions[session_id]
    return {"ok": True, "session_id": session_id}
