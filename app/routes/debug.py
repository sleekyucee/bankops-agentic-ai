from fastapi import APIRouter
from pydantic import BaseModel

from app.crewai.escalation_crew import run_escalation_review
from app.db.database import (
    get_metrics_summary,
    get_recent_conversations,
    get_support_tickets,
    record_metric,
)
from app.rag.retriever import retrieve_relevant_chunks
from app.rag.vector_store import search_vector_store
from app.tools.customer_context import get_customer_context


router = APIRouter(prefix="/debug", tags=["debug"])


class EscalationReviewRequest(BaseModel):
    case_summary: str
    priority: str
    assigned_team: str
    account_risk_level: str | None = None


@router.get("/conversations/{user_id}")
def debug_conversations(user_id: str):
    return {
        "user_id": user_id,
        "conversations": get_recent_conversations(user_id),
    }


@router.get("/customer/{user_id}")
def debug_customer(user_id: str):
    return get_customer_context(user_id)


@router.get("/rag/search")
def debug_rag_search(q: str):
    return {
        "query": q,
        "results": retrieve_relevant_chunks(q, top_k=3),
    }


@router.get("/rag/vector-search")
def debug_rag_vector_search(q: str):
    documents = search_vector_store(q, top_k=3)

    return {
        "query": q,
        "results": [
            {
                "filename": document.metadata.get("filename"),
                "content": document.page_content,
                "source": document.metadata.get("source"),
            }
            for document in documents
        ],
    }


@router.get("/tickets")
def debug_tickets():
    return {
        "tickets": get_support_tickets(),
    }


@router.get("/tickets/{user_id}")
def debug_tickets_for_user(user_id: str):
    return {
        "tickets": get_support_tickets(user_id),
    }


@router.get("/metrics")
def debug_metrics():
    return get_metrics_summary()


@router.post("/crew/escalation-review")
def debug_crew_escalation_review(request: EscalationReviewRequest):
    record_metric(
        event_type="crew_review_debug_called",
        metadata={
            "priority": request.priority,
            "assigned_team": request.assigned_team,
            "account_risk_level": request.account_risk_level,
        },
    )
    return run_escalation_review(
        case_summary=request.case_summary,
        priority=request.priority,
        assigned_team=request.assigned_team,
        account_risk_level=request.account_risk_level,
    )
