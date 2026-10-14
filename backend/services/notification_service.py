# =========================================================
# NOTIFICATION SERVICE
# Helper functions for creating notifications.
# =========================================================

from database.db import query_all, execute, get_connection


def create_notification(user_id, title, message, type="general"):
    """Create a single notification for a user. Returns its id."""

    return execute(
        "INSERT INTO notifications (user_id, title, message, type) "
        "VALUES (%s, %s, %s, %s)",
        (user_id, title, message, type),
        return_id=True
    )


def notify_all(title, message, type="general"):
    """Create a notification for every student. Returns how many were sent.

    Uses a single connection and one bulk INSERT so the cost does not grow
    with the number of students (a per-user connection would be O(N) and
    slow the request to a timeout on a large user base).
    """

    users = query_all("SELECT id FROM users WHERE role = 'student'")

    if not users:
        return 0

    rows = [(user["id"], title, message, type) for user in users]

    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.executemany(
            "INSERT INTO notifications (user_id, title, message, type) "
            "VALUES (%s, %s, %s, %s)",
            rows
        )
        connection.commit()

        return cursor.rowcount

    except Exception:
        connection.rollback()
        raise

    finally:
        cursor.close()
        connection.close()
