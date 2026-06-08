def fraud_review_agent(case_summary: str) -> dict:
    """Represent a future CrewAI fraud-review Agent and Task deterministically."""
    summary = case_summary.lower()
    fraud_indicators = [
        "fraud",
        "scam",
        "suspicious",
        "unauthorised",
        "unauthorized",
        "unrecognized",
        "charge",
    ]
    fraud_signals = [
        indicator for indicator in fraud_indicators if indicator in summary
    ]

    return {
        "fraud_related": bool(fraud_signals),
        "fraud_signals": fraud_signals,
        "recommended_action": (
            "Review the reported activity and card status."
            if fraud_signals
            else "No direct fraud indicator detected."
        ),
    }


def risk_triage_agent(
    priority: str,
    account_risk_level: str | None = None,
) -> dict:
    """Represent a future CrewAI risk-triage Agent and Task deterministically."""
    normalized_priority = priority.lower()
    normalized_risk = (account_risk_level or "unknown").lower()
    high_risk = normalized_priority == "high" or normalized_risk == "high"

    return {
        "input_priority": normalized_priority,
        "account_risk_level": normalized_risk,
        "recommended_priority": "high" if high_risk else normalized_priority,
        "requires_prompt_review": high_risk,
    }


def support_routing_agent(case_summary: str, priority: str) -> dict:
    """Represent a future CrewAI support-routing Agent and Task deterministically."""
    summary = case_summary.lower()

    if any(
        term in summary
        for term in [
            "fraud",
            "scam",
            "suspicious",
            "unauthorised",
            "unauthorized",
            "unrecognized",
        ]
    ):
        recommended_team = "fraud_support"
    elif any(
        term in summary
        for term in ["password", "login", "locked", "access", "account"]
    ):
        recommended_team = "account_support"
    elif any(
        term in summary
        for term in ["refund", "chargeback", "billing", "dispute"]
    ):
        recommended_team = "billing_support"
    else:
        recommended_team = "general_support"

    return {
        "recommended_team": recommended_team,
        "routing_reason": f"Case content matched {recommended_team}.",
        "priority_considered": priority.lower(),
    }


def run_escalation_review(
    case_summary: str,
    priority: str,
    assigned_team: str,
    account_risk_level: str | None = None,
) -> dict:
    """Represent a future CrewAI Crew coordinating three specialist tasks."""
    fraud_review = fraud_review_agent(case_summary)
    risk_triage = risk_triage_agent(priority, account_risk_level)
    support_routing = support_routing_agent(case_summary, priority)

    recommended_team = support_routing["recommended_team"]
    if recommended_team == "general_support" and assigned_team:
        recommended_team = assigned_team

    return {
        "crew_review_status": "completed",
        "fraud_review": fraud_review,
        "risk_triage": risk_triage,
        "support_routing": support_routing,
        "final_recommendation": {
            "recommended_team": recommended_team,
            "recommended_priority": risk_triage["recommended_priority"],
            "human_review_required": True,
        },
    }
