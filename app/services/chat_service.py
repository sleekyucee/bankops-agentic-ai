from app.models.chat import ChatRequest, ChatResponse
from app.orchestration.langgraph.graph import chat_graph
from app.db.database import get_recent_conversations, save_conversation

def generate_chat_response(request: ChatRequest) -> ChatResponse:
    recent_conversations = get_recent_conversations(request.user_id)

    final_state = chat_graph.invoke(
        {
            "user_id": request.user_id,
            "message": request.message,
            "conversation_history": recent_conversations,
            "decision_trace": []
        }
    )

    save_conversation(
        user_id=request.user_id,
        message=request.message,
        intent=final_state["intent"],
        reply=final_state["reply"],
    )

    return ChatResponse(
        reply=final_state["reply"],
        status="success",
        escalation_required=final_state.get("escalation_required", False),
        escalation_priority=final_state.get("escalation_priority"),
        assigned_team=final_state.get("assigned_team"),
        intent=final_state["intent"],
        decision_trace=final_state.get("decision_trace", []),
        ticket_id=final_state.get("ticket_id"),
        case_summary=final_state.get("case_summary"),
        created_at=final_state.get("created_at"),
        human_review_required=final_state.get("human_review_required", False),
        approval_status=final_state.get("approval_status"),
        review_queue=final_state.get("review_queue")
    )
