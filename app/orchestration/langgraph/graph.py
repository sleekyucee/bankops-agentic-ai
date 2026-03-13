from langgraph.graph import StateGraph, START, END
from app.orchestration.langgraph.state import ChatState

def detect_intent_node(state: ChatState) -> ChatState:
    message = state["message"].lower()
    words = message.split()

    if any(word in words for word in ["hello", "hi", "hey"]):
        intent = "greeting"

    elif any(word in words for word in ["spend", "spending", "transaction", "transaction", "groceries", "budget"]):
        intent = "spending_analysis"

    elif any(word in words for word in ["suspicious", "fraud", "charge", "scam", "unrecognized"]):
        intent = "fraud_check"

    else:
        intent = "general"

    return {
        **state,
        "intent": intent
    }

def greeting_node(state: ChatState) -> ChatState:
    return{
        **state,
        "reply": "Hello! I can help with bankng support, spending insights, and suspicious transaction checks."
    }

def spending_node(state: ChatState) -> ChatState:
    return{
        **state,
        "reply": "Mock spending analysis: I can help summarize your transactions and explain changes in your spending."
    }

def fraud_node(state: ChatState) -> ChatState:
    return{
        **state,
        "reply": "Mock fraud support: I can help review suspicious or unrecognized charges and guide next steps."
    }

def general_node(state: ChatState) -> ChatState:
    return{
        **state,
        "reply": f"General support response: I received your message '{state['message']}'."
    }

def route_intent(state: ChatState) -> str:
    return state["intent"]

graph_builder = StateGraph(ChatState)

graph_builder.add_node("detect_intent", detect_intent_node)
graph_builder.add_node("greeting", greeting_node)
graph_builder.add_node("spending_analysis", spending_node)
graph_builder.add_node("fraud_check", fraud_node)
graph_builder.add_node("general", general_node)

graph_builder.add_edge(START, "detect_intent")
graph_builder.add_conditional_edges(
    "detect_intent",
    route_intent,
    {
        "greeting": "greeting",
        "spending_analysis": "spending_analysis",
        "fraud_check": "fraud_check",
        "general": "general"
    }
)

graph_builder.add_edge("greeting", END)
graph_builder.add_edge("spending_analysis", END)
graph_builder.add_edge("fraud_check", END)
graph_builder.add_edge("general", END)

chat_graph = graph_builder.compile()
