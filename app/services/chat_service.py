from app.models.chat import ChatRequest, ChatResponse
from app.orchestration.langgraph.graph import chat_graph

def generate_chat_response(request: ChatRequest) -> ChatResponse:
    final_state = chat_graph.invoke(
        {
            "message": request.message
        }
    )

    return ChatResponse(
        reply=final_state["reply"],
        status="success"
    )