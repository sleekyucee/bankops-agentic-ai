from langgraph.graph import StateGraph, START, END
from app.orchestration.langgraph.state import ChatState
from app.orchestration.langgraph.nodes import (
    detect_intent_node,
    greeting_node,
    spending_node,
    fraud_node,
    general_node,
    escalation_node,
    route_intent
)

graph_builder = StateGraph(ChatState)

graph_builder.add_node("detect_intent", detect_intent_node)
graph_builder.add_node("greeting", greeting_node)
graph_builder.add_node("spending_analysis", spending_node)
graph_builder.add_node("fraud_check", fraud_node)
graph_builder.add_node("escalation", escalation_node)
graph_builder.add_node("general", general_node)

graph_builder.add_edge(START, "detect_intent")
graph_builder.add_conditional_edges(
    "detect_intent",
    route_intent,
    {
        "greeting": "greeting",
        "spending_analysis": "spending_analysis",
        "fraud_check": "fraud_check",
        "escalation": "escalation",
        "general": "general",
    },
)

graph_builder.add_edge("greeting", END)
graph_builder.add_edge("spending_analysis", END)
graph_builder.add_edge("fraud_check", END)
graph_builder.add_edge("escalation", END)
graph_builder.add_edge("general", END)

chat_graph = graph_builder.compile()
