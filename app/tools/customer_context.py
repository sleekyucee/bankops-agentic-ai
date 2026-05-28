from app.db.database import get_connection


def get_customer_context(user_id: str) -> dict:
    query = """
        SELECT
            user_id,
            customer_name,
            card_status,
            account_risk_level,
            recent_contact_count
        FROM customer_profiles
        WHERE user_id = ?
    """

    with get_connection() as connection:
        row = connection.execute(query, (user_id,)).fetchone()

    if row is None:
        return {
            "user_id": user_id,
            "customer_name": "Customer",
            "card_status": "active",
            "account_risk_level": "unknown",
            "recent_contact_count": 0
        }

    return {
        "user_id": row["user_id"],
        "customer_name": row["customer_name"],
        "card_status": row["card_status"],
        "account_risk_level": row["account_risk_level"],
        "recent_contact_count": row["recent_contact_count"]
    }
