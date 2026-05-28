from typing import TypedDict, List, Optional

class ChatState(TypedDict):
    user_id: str
    message: str
    intent: str
    reply: str
    escalation_required: bool
    escalation_priority: Optional[str]
    assigned_team: Optional[str]
    decision_trace: List[str]
    ticket_id: Optional[str]
    case_summary: Optional[str]
    created_at: Optional[str]
    human_review_required: bool
    approval_status: Optional[str]
    review_queue: Optional[str]
