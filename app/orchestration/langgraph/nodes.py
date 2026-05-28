from app.orchestration.langgraph.state import ChatState
from app.tools.spending_tools import get_mock_spending_data
from app.tools.fraud_tools import get_mock_fraud_case
from app.tools.general_tools import generate_general_support
from app.tools.customer_context import get_customer_context
from app.rag.retriever import retrieve_relevant_chunks

from datetime import datetime, timezone
import uuid


def detect_intent_node(state: ChatState) -> ChatState:
    message = state["message"].lower()
    words = message.split()
    informational_prefixes = ("what is", "how does", "how long")
    informational_queries = [
        "how do chargebacks work",
        "how long does a refund take",
        "what happens when my card is frozen",
    ]
    action_fraud_phrases = [
        "check my card for suspicious activity",
        "fraud on my card",
        "someone used my card",
        "unauthorised transaction",
        "unauthorized transaction",
        "freeze my card",
    ]

    if any(word in words for word in ["hello", "hi", "hey"]):
        intent = "greeting"

    elif (
        any(query in message for query in informational_queries)
        or message.startswith(informational_prefixes)
    ):
        intent = "general"

    elif (
        any(phrase in message for phrase in action_fraud_phrases)
        or any(word in message for word in ["suspicious", "fraud", "scam", "unrecognized"])
    ):
        intent = "fraud_check"

    elif any(word in message for word in ["spend", "spending", "transaction", "transactions", "groceries", "budget"]):
        intent = "spending_analysis"

    elif any(word in message for word in ["agent", "human", "escalate", "complaint", "manager", "urgent"]):
        intent = "escalation"

    else:
        intent = "general"

    return {
        **state,
        "intent": intent,
        "decision_trace": [f"intent_detected: {intent}"]
    }


def greeting_node(state: ChatState) -> ChatState:
    decision_trace = state.get("decision_trace", []) + ["handler: greeting_node"]
    conversation_history = state.get("conversation_history", [])
    reply = "Hello! I can help with banking support, spending insights, and suspicious transaction checks."

    if conversation_history:
        reply = (
            "Welcome back. I can see you've used BankOps recently. "
            "I can help with banking support, spending insights, and suspicious transaction checks."
        )

    return {
        **state,
        "reply": reply,
        "escalation_required": False,
        "escalation_priority": None,
        "assigned_team": None,
        "decision_trace": decision_trace,
        "ticket_id": None,
        "case_summary": None,
        "created_at": None
    }


def spending_node(state: ChatState) -> ChatState:
    spending_data = get_mock_spending_data(state["user_id"])
    customer_context = get_customer_context(state["user_id"])

    monthly_total = spending_data["monthly_total"]
    top_category = spending_data["top_category"]
    transaction_count = spending_data["transaction_count"]
    customer_name = customer_context["customer_name"]
    context_card_status = customer_context["card_status"]
    recent_contact_count = customer_context["recent_contact_count"]

    reply = (
        f"Welcome back {customer_name}. I can see your account is {context_card_status} "
        f"and you contacted support {recent_contact_count} times recently. "
        f"Sample spending summary: your monthly total is GBP {monthly_total:.2f}. "
        f"Your highest spending category is {top_category}, across {transaction_count} transactions."
    )

    decision_trace = state.get("decision_trace", []) + ["handler: spending_node"]

    return {
        **state,
        "reply": reply,
        "escalation_required": False,
        "escalation_priority": None,
        "assigned_team": None,
        "decision_trace": decision_trace,
        "ticket_id": None,
        "case_summary": None,
        "created_at": None
    }


def fraud_node(state: ChatState) -> ChatState:
    message = state["message"].lower()
    fraud_case = get_mock_fraud_case(state["user_id"])
    customer_context = get_customer_context(state["user_id"])

    flagged_transaction = fraud_case["flagged_transaction"]
    merchant = flagged_transaction["merchant"]
    amount = flagged_transaction["amount"]
    reason = flagged_transaction["reason"]
    risk_level = fraud_case["risk_level"]
    card_status = fraud_case["card_status"]
    context_card_status = customer_context["card_status"]
    account_risk_level = customer_context["account_risk_level"]

    if risk_level == "high":
        next_step = "freeze card and review your most recent transactions immediately."
    elif risk_level == "medium":
        next_step = "review the transaction and monitor your account activity closely."
    else:
        next_step = "keep monitoring the transaction and contact support if anything changes."

    context_summary = (
        f"I can see your account risk level is {account_risk_level} "
        f"and your card is currently {context_card_status}. "
    )

    reply = (
        context_summary +
        f"Fraud review: a GBP {amount} charge from {merchant} has been flagged as {risk_level} risk "
        f"due to {reason}. Card status: {card_status}. Recommended next step: {next_step}"
    )

    escalation_requested = any(
        word in message for word in ["agent", "human", "escalate", "manager", "urgent"]
    )

    priority = "high" if "urgent" in message else "medium"

    decision_trace = state.get("decision_trace", []) + [
        "handler: fraud_node",
        f"escalation_requested: {escalation_requested}"
    ]

    if escalation_requested:
        ticket_id = f"TKT-{uuid.uuid4().hex[:8].upper()}"
        created_at = datetime.now(timezone.utc).isoformat()
        case_summary = (
            f"Fraud escalation for suspicious transaction at {merchant} "
            f"amount GBP {amount} with {priority} priority."
        )

        decision_trace = decision_trace + [
            "ticket_created: True",
            f"ticket_id: {ticket_id}"
        ]

        return {
            **state,
            "reply": reply,
            "escalation_required": True,
            "escalation_priority": priority,
            "assigned_team": "fraud_support",
            "decision_trace": decision_trace,
            "ticket_id": ticket_id,
            "case_summary": case_summary,
            "created_at": created_at
        }

    return {
        **state,
        "reply": reply,
        "escalation_required": False,
        "escalation_priority": None,
        "assigned_team": None,
        "decision_trace": decision_trace,
        "ticket_id": None,
        "case_summary": None,
        "created_at": None
    }


def escalation_node(state: ChatState) -> ChatState:
    message = state["message"].lower()

    if any(word in message for word in ["urgent", "immediately", "asap", "locked", "can't access", "cannot access"]):
        priority = "high"
    else:
        priority = "medium"

    if any(word in message for word in ["fraud", "scam", "suspicious", "charge", "unrecognized"]):
        assigned_team = "fraud_support"
    elif any(word in message for word in ["password", "locked", "login", "access", "account"]):
        assigned_team = "account_support"
    else:
        assigned_team = "general_support"

    ticket_id = f"TKT-{uuid.uuid4().hex[:8].upper()}"
    created_at = datetime.now(timezone.utc).isoformat()
    case_summary = f"Escalation request routed to {assigned_team} with {priority} priority."

    decision_trace = state.get("decision_trace", []) + [
        "handler: escalation_node",
        f"priority: {priority}",
        f"assigned_team: {assigned_team}",
        "ticket_created: True",
        f"ticket_id: {ticket_id}"
    ]

    reply = (
        f"I understand this may need extra support. "
        f"I've flagged this as a {priority}-priority case and recommend routing it "
        f"to the {assigned_team} team for further assistance."
    )

    return {
        **state,
        "reply": reply,
        "escalation_required": True,
        "escalation_priority": priority,
        "assigned_team": assigned_team,
        "decision_trace": decision_trace,
        "ticket_id": ticket_id,
        "case_summary": case_summary,
        "created_at": created_at
    }


def general_node(state: ChatState) -> ChatState:
    decision_trace = state.get("decision_trace", []) + ["handler: general_node"]
    relevant_chunks = retrieve_relevant_chunks(state["message"], top_k=3)
    conversation_history = state.get("conversation_history", [])

    if relevant_chunks:
        decision_trace = decision_trace + [f"rag_chunks_found: {len(relevant_chunks)}"]
        top_score = relevant_chunks[0]["score"]
        sources = sorted(
            {
                chunk["filename"]
                for chunk in relevant_chunks
                if chunk["score"] == top_score
            }
        )
        primary_content = relevant_chunks[0]["content"].lower()

        if "freeze" in primary_content and "pending transactions may still complete" in primary_content:
            answer = (
                "Based on our card freeze policy, when a card is frozen, new card transactions "
                "are blocked, but pending transactions may still complete."
            )
        else:
            answer = (
                "Based on our support guidance, I found relevant internal policy information "
                "for your question."
            )

        reply = f"{answer} Source: {', '.join(sources)}"
    else:
        decision_trace = decision_trace + ["rag_chunks_found: 0", "fallback: general_support"]
        reply = generate_general_support(state["message"])

        if conversation_history:
            reply = f"I can see you have previous BankOps interactions. {reply}"

    return {
        **state,
        "reply": reply,
        "escalation_required": False,
        "escalation_priority": None,
        "assigned_team": None,
        "decision_trace": decision_trace,
        "ticket_id": None,
        "case_summary": None,
        "created_at": None
    }


def route_intent(state: ChatState) -> str:
    return state["intent"]
