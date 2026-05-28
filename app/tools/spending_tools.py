def get_mock_spending_data(user_id: str) -> dict:
    spending_by_user = {
        "user_001": {
            "monthly_total": 285.50,
            "top_category": "bills",
            "transaction_count": 14
        },
        "user_002": {
            "monthly_total": 432.75,
            "top_category": "dining",
            "transaction_count": 22
        },
    }

    return spending_by_user.get(
        user_id,
        {
            "monthly_total": 0.00,
            "top_category": "none",
            "transaction_count": 0
        }
    )
