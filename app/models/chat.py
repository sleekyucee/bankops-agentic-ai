from typing import Optional
from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    user_id: str
    message: str

class ChatResponse(BaseModel):
    reply: str
    status: str
    escalation_required: bool = False
    escalation_priority: Optional[str] = None
    assigned_team: Optional[str] = None
    intent: str
    decision_trace: list[str] = Field(default_factory=list)
    ticket_id: Optional[str] = None
    case_summary: Optional[str] = None
    created_at: Optional[str] = None
    human_review_required: bool = False
    approval_status: Optional[str] = None
    review_queue: Optional[str] = None
