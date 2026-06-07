import json
import sqlite3
import uuid
from datetime import datetime, timezone
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
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS system_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT,
                user_id TEXT,
                intent TEXT,
                metadata TEXT,
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


def save_conversation(user_id: str, message: str, intent: str, reply: str) -> None:
    created_at = datetime.now(timezone.utc).isoformat()

    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO conversation_history (
                user_id,
                message,
                intent,
                reply,
                created_at
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, message, intent, reply, created_at),
        )


def create_support_ticket(
    user_id: str,
    issue_type: str,
    priority: str,
    assigned_team: str,
    case_summary: str,
) -> str:
    ticket_id = f"TKT-{uuid.uuid4().hex[:8].upper()}"
    created_at = datetime.now(timezone.utc).isoformat()

    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO support_tickets (
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
            (
                ticket_id,
                user_id,
                issue_type,
                priority,
                assigned_team,
                "open",
                case_summary,
                created_at,
            ),
        )

    return ticket_id


def record_metric(
    event_type: str,
    user_id: str | None = None,
    intent: str | None = None,
    metadata: dict | None = None,
) -> None:
    created_at = datetime.now(timezone.utc).isoformat()
    metadata_json = json.dumps(metadata or {})

    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS system_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT,
                user_id TEXT,
                intent TEXT,
                metadata TEXT,
                created_at TEXT
            )
            """
        )
        connection.execute(
            """
            INSERT INTO system_metrics (
                event_type,
                user_id,
                intent,
                metadata,
                created_at
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (event_type, user_id, intent, metadata_json, created_at),
        )


def get_metrics_summary() -> dict:
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS system_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT,
                user_id TEXT,
                intent TEXT,
                metadata TEXT,
                created_at TEXT
            )
            """
        )
        rows = connection.execute(
            """
            SELECT event_type, intent, metadata
            FROM system_metrics
            """
        ).fetchall()

    intent_counts = {}
    event_counts = {}
    rag_vector_used = 0
    rag_keyword_used = 0

    for row in rows:
        event_type = row["event_type"]
        event_counts[event_type] = event_counts.get(event_type, 0) + 1

        if event_type == "conversation_saved" and row["intent"]:
            intent = row["intent"]
            intent_counts[intent] = intent_counts.get(intent, 0) + 1

        if event_type == "rag_retriever_used":
            metadata = json.loads(row["metadata"] or "{}")
            if metadata.get("retriever") == "vector":
                rag_vector_used += 1
            elif metadata.get("retriever") == "keyword":
                rag_keyword_used += 1

    return {
        "total_events": len(rows),
        "total_chat_requests": event_counts.get("chat_request_received", 0),
        "intent_counts": intent_counts,
        "tickets_created": event_counts.get("ticket_created", 0),
        "rag_vector_used": rag_vector_used,
        "rag_keyword_used": rag_keyword_used,
        "conversations_saved": event_counts.get("conversation_saved", 0),
    }


def get_support_tickets(user_id: str | None = None) -> list[dict]:
    query = """
        SELECT
            ticket_id,
            user_id,
            issue_type,
            priority,
            assigned_team,
            status,
            case_summary,
            created_at
        FROM support_tickets
    """
    parameters = ()

    if user_id is not None:
        query += " WHERE user_id = ?"
        parameters = (user_id,)

    query += " ORDER BY created_at DESC"

    with get_connection() as connection:
        rows = connection.execute(query, parameters).fetchall()

    return [dict(row) for row in rows]


def get_recent_conversations(user_id: str, limit: int = 5) -> list[dict]:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT
                message,
                intent,
                reply,
                created_at
            FROM conversation_history
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (user_id, limit),
        ).fetchall()

    return [
        {
            "message": row["message"],
            "intent": row["intent"],
            "reply": row["reply"],
            "created_at": row["created_at"],
        }
        for row in rows
    ]


if __name__ == "__main__":
    initialize_database()
    print(f"Initialized SQLite database at {DB_PATH}")
