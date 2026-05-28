def get_mock_fraud_case(user_id: str) -> dict:
    fraud_cases_by_user = {
        "user_001": {
            "risk_level": "high",
            "flagged_transaction": {
                "merchant": "ElectroHub",
                "amount": 249.99,
                "reason": "unusual merchant activity"
            },
            "card_status": "frozen"
        },
        "user_002": {
            "risk_level": "medium",
            "flagged_transaction": {
                "merchant": "TravelNow",
                "amount": 89.50,
                "reason": "unusual location"
            },
            "card_status": "active"
        },
    }

    return fraud_cases_by_user.get(
        user_id,
        {
            "risk_level": "low",
            "flagged_transaction": {
                "merchant": "Unknown",
                "amount": 0.00,
                "reason": "no matching mock fraud case"
            },
            "card_status": "active"
        }
    )
