# =========================================================
# REMINDER SERVICE
# Finds upcoming assignment / exam deadlines for a student.
# =========================================================

from database.db import query_all


def upcoming_assignments(user_id, days=7):
    """Assignments that are not submitted and due within the next N days."""

    return query_all(
        "SELECT a.id, a.title, a.due_date, a.status, c.course_name "
        "FROM assignments a LEFT JOIN courses c ON a.course_id = c.id "
        "WHERE a.user_id = %s AND a.status <> 'Submitted' "
        "AND a.due_date IS NOT NULL "
        "AND a.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL %s DAY) "
        "ORDER BY a.due_date",
        (user_id, days)
    )


def upcoming_exams(user_id, days=14):
    """Exams scheduled within the next N days."""

    return query_all(
        "SELECT e.id, e.exam_name, e.exam_date, e.start_time, e.room, c.course_name "
        "FROM exams e LEFT JOIN courses c ON e.course_id = c.id "
        "WHERE e.user_id = %s AND e.exam_date IS NOT NULL "
        "AND e.exam_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL %s DAY) "
        "ORDER BY e.exam_date, e.start_time",
        (user_id, days)
    )
