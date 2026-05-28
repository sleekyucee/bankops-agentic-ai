from fastapi import APIRouter

from app.db.database import get_recent_conversations
from app.tools.customer_context import get_customer_context


router = APIRouter(prefix="/debug", tags=["debug"])


@router.get("/conversations/{user_id}")
def debug_conversations(user_id: str):
    return {
        "user_id": user_id,
        "conversations": get_recent_conversations(user_id),
    }


@router.get("/customer/{user_id}")
def debug_customer(user_id: str):
    return get_customer_context(user_id)
