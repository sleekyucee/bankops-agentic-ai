import json
import sqlite3
from pathlib import Path


DB_PATH = Path(__file__).resolve().parents[2] / "bankops.db"


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def create_tables() -> None:
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS customer_profiles (
                user_id TEXT PRIMARY KEY,
                customer_name TEXT,
                card_status TEXT,
                account_risk_level TEXT,
                recent_contact_count INTEGER
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS support_tickets (
                ticket_id TEXT PRIMARY KEY,
                user_id TEXT,
                issue_type TEXT,
                priority TEXT,
                assigned_team TEXT,
                status TEXT,
                case_summary TEXT,
                created_at TEXT
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS fraud_cases (
                case_id TEXT PRIMARY KEY,
                user_id TEXT,
                risk_level TEXT,
                flagged_transaction TEXT,
                card_status TEXT,
                status TEXT,
                created_at TEXT
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS conversation_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                message TEXT,
                intent TEXT,
                reply TEXT,
                created_at TEXT
            )
            """
        )


def seed_initial_data() -> None:
    customer_profiles = [
        ("user_001", "Uche", "frozen", "high", 2),
        ("user_002", "Amara", "active", "low", 0),
        ("user_003", "Tunde", "active", "medium", 3),
    ]

    support_tickets = [
        (
            "TKT-1024",
            "user_001",
            "fraud",
            "high",
            "fraud_support",
            "open",
            "Open fraud ticket for suspicious card activity.",
            "2026-05-28T09:00:00+00:00",
        ),
        (
            "TKT-2048",
            "user_003",
            "spending_dispute",
            "medium",
            "billing_support",
            "open",
            "Recent spending dispute under review.",
            "2026-05-27T14:30:00+00:00",
        ),
    ]

    fraud_cases = [
        (
            "FRD-1001",
            "user_001",
            "high",
            json.dumps(
                {
                    "merchant": "ElectroHub",
                    "amount": 249.99,
                    "reason": "unusual merchant activity",
                }
            ),
            "frozen",
            "open",
            "2026-05-28T09:05:00+00:00",
        ),
        (
            "FRD-1002",
            "user_002",
            "low",
            json.dumps(
                {
                    "merchant": "None",
                    "amount": 0.00,
                    "reason": "no active fraud case",
                }
            ),
            "active",
            "closed",
            "2026-05-20T10:00:00+00:00",
        ),
    ]

    conversations = [
        (
            "user_001",
            "I saw a suspicious charge.",
            "fraud_check",
            "Fraud review opened for suspicious card activity.",
            "2026-05-28T09:10:00+00:00",
        ),
        (
            "user_002",
            "Hi",
            "greeting",
            "Hello! I can help with banking support, spending insights, and suspicious transaction checks.",
            "2026-05-26T11:00:00+00:00",
        ),
        (
            "user_003",
            "I want to dispute a recent transaction.",
            "spending_analysis",
            "Recent spending dispute under review.",
            "2026-05-27T14:35:00+00:00",
        ),
    ]

    with get_connection() as connection:
        connection.executemany(
            """
            INSERT OR IGNORE INTO customer_profiles (
                user_id,
                customer_name,
                card_status,
                account_risk_level,
                recent_contact_count
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            customer_profiles,
        )
        connection.executemany(
            """
            INSERT OR IGNORE INTO support_tickets (
                ticket_id,
                user_id,
                issue_type,
                priority,
                assigned_team,
                status,
                case_summary,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            support_tickets,
        )
        connection.executemany(
            """
            INSERT OR IGNORE INTO fraud_cases (
                case_id,
                user_id,
                risk_level,
                flagged_transaction,
                card_status,
                status,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            fraud_cases,
        )
        connection.executemany(
            """
            INSERT INTO conversation_history (
                user_id,
                message,
                intent,
                reply,
                created_at
            )
            SELECT ?, ?, ?, ?, ?
            WHERE NOT EXISTS (
                SELECT 1 FROM conversation_history
                WHERE user_id = ? AND message = ? AND created_at = ?
            )
            """,
            [
                conversation + (conversation[0], conversation[1], conversation[4])
                for conversation in conversations
            ],
        )


def initialize_database() -> None:
    create_tables()
    seed_initial_data()


if __name__ == "__main__":
    initialize_database()
    print(f"Initialized SQLite database at {DB_PATH}")
