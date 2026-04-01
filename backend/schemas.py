from pydantic import BaseModel, Field


class RunWorkflowRequest(BaseModel):
    session_id: str = Field(..., min_length=1)
    input: str = Field(..., min_length=3)
    demo_scenario: str | None = None


class RefineRequest(BaseModel):
    session_id: str
    agent_name: str
    feedback: str


class NodeExplainRequest(BaseModel):
    session_id: str
    node_id: str
    confidence: int = 50


class ScenarioRequest(BaseModel):
    session_id: str
    scenario: str


class CompareRequest(BaseModel):
    session_id: str
    option_a: str
    option_b: str


class TimelineRequest(BaseModel):
    session_id: str
    decision: str


class SessionStateRequest(BaseModel):
    session_id: str
    state: dict


class RunWorkflowStreamRequest(BaseModel):
    session_id: str = Field(..., min_length=1)
    input: str = Field(..., min_length=3)
    demo_scenario: str | None = None
