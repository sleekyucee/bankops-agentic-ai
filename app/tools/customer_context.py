def get_customer_context(user_id: str) -> dict:
    context_by_user = {
        "user_001": {
            "customer_name": "Uche",
            "open_ticket_id": "TKT-1024",
            "last_issue": "reported suspicious card activity",
            "card_status": "frozen",
            "account_risk_level": "high",
            "recent_contact_count": 2
        },
        "user_002": {
            "customer_name": "Amara",
            "open_ticket_id": None,
            "last_issue": None,
            "card_status": "active",
            "account_risk_level": "low",
            "recent_contact_count": 0
        },
        "user_003": {
            "customer_name": "Tunde",
            "open_ticket_id": "TKT-2048",
            "last_issue": "recent spending dispute",
            "card_status": "active",
            "account_risk_level": "medium",
            "recent_contact_count": 3
        },
    }

    return context_by_user.get(
        user_id,
        {
            "customer_name": "there",
            "open_ticket_id": None,
            "last_issue": None,
            "card_status": "active",
            "account_risk_level": "low",
            "recent_contact_count": 0
        }
    )
