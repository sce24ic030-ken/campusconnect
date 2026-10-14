# =========================================================
# CHATBOT SERVICE
# Primary: GPT-OSS 20B via the NVIDIA NIM API (OpenAI-compatible).
# Fallback: a project-aware guide when LLM is unavailable.
# =========================================================

import json
import urllib.error
import urllib.request

from flask import current_app

from database.db import query_all, query_one
from services.reminder_service import upcoming_assignments, upcoming_exams


# =========================================================
# SHARED HELPERS
# =========================================================

def _format_time(value):
    if hasattr(value, "total_seconds"):
        total = int(value.total_seconds())
        return f"{total // 3600:02d}:{(total % 3600) // 60:02d}"
    return str(value)


def _contains(text, *keywords):
    return any(keyword in text for keyword in keywords)


# =========================================================
# STUDENT CONTEXT (live data)
# =========================================================

def _student_context(user_id):
    if not user_id:
        return (
            "User type: Guest (not signed in)\n"
            "Project: CampusConnect — AI College Companion (student portal)\n"
            "Pages: Dashboard, Courses, Timetable, Assignments, Attendance, Academics, Faculty, "
            "Placement, Results, Documents, Complaints, Feedback, Lost & Found, Campus, Events, "
            "Exams, Notifications, Profile, Settings, Login/Register."
        )

    lines = []

    profile = query_one(
        "SELECT name, course, semester, student_id FROM users WHERE id = %s",
        (user_id,)
    )
    if profile:
        lines.append(
            "Profile: name={name}, course={course}, semester={semester}".format(
                name=profile.get("name") or "student",
                course=profile.get("course") or "not set",
                semester=profile.get("semester") or "not set",
            )
        )

    attendance = query_one(
        "SELECT COUNT(*) AS total, "
        "ROUND(SUM(status IN ('Present', 'Late')) / COUNT(*) * 100, 2) AS percentage "
        "FROM attendance WHERE user_id = %s",
        (user_id,)
    )
    if attendance and attendance.get("total"):
        lines.append(
            f"Attendance: {attendance['percentage']}% across {attendance['total']} recorded classes"
        )
    else:
        lines.append("Attendance: no records yet")

    unread = query_one(
        "SELECT COUNT(*) AS total FROM notifications WHERE user_id = %s AND is_read = 0",
        (user_id,)
    )
    lines.append(f"Unread notifications: {unread['total'] if unread else 0}")

    assignments = upcoming_assignments(user_id, 30)
    if assignments:
        pending = "; ".join(f"{row['title']} (due {row['due_date']})" for row in assignments[:5])
        lines.append(f"Pending assignments: {pending}")
    else:
        lines.append("Pending assignments: none")

    exams = upcoming_exams(user_id, 30)
    if exams:
        upcoming = "; ".join(f"{row['exam_name']} on {row['exam_date']}" for row in exams[:5])
        lines.append(f"Upcoming exams: {upcoming}")
    else:
        lines.append("Upcoming exams: none")

    timetable = query_all(
        "SELECT c.course_name, t.start_time, t.end_time, t.room "
        "FROM timetable t LEFT JOIN courses c ON t.course_id = c.id "
        "WHERE t.user_id = %s AND t.day = DAYNAME(CURDATE()) ORDER BY t.start_time",
        (user_id,)
    )
    if timetable:
        classes = "; ".join(
            f"{row['course_name'] or 'Class'} {_format_time(row['start_time'])}-{_format_time(row['end_time'])}"
            f"{' in ' + row['room'] if row['room'] else ''}"
            for row in timetable
        )
        lines.append(f"Today's classes: {classes}")
    else:
        lines.append("Today's classes: none")

    return "\n".join(lines)


SYSTEM_PROMPT = (
    "You are CampusConnect AI, the AI College Companion for the CampusConnect student portal "
    "(BCA final-year project). You guide students through the entire app — Dashboard, Courses, "
    "Timetable, Assignments, Attendance, Academics, Faculty, Placement, Results, Documents, "
    "Complaints, Feedback, Lost & Found, Campus, Events, Exams, Notifications, Profile, Settings "
    "— with clear, step-by-step guidance. Roles: student, faculty, admin. New signups are students.\n\n"
    "When the user is signed in, use their live data below; never invent data. "
    "When not signed in (guest), explain the app and guide navigation.\n\n"
    "Be concise and friendly. Use short bullet points for lists. Answer with markdown-light "
    "formatting (**bold** for important things). Also direct them to the right page when helpful. "
    "If asked about the whole project, explain its purpose, modules, tech stack and how to use it. "
    "The AI runs on NVIDIA NIM (gpt-oss-20b)."
)


# =========================================================
# LLM
# =========================================================

def _recent_history(user_id, limit=8):
    if not user_id:
        return []
    rows = query_all(
        "SELECT sender, message FROM chatbot_messages WHERE user_id = %s ORDER BY id DESC LIMIT %s",
        (user_id, limit)
    )
    messages = []
    for row in reversed(rows):
        role = "assistant" if row["sender"] == "bot" else "user"
        messages.append({"role": role, "content": row["message"]})
    return messages


def _call_nim(messages):
    api_key = current_app.config.get("NVIDIA_API_KEY")
    if not api_key:
        return None

    base_url = current_app.config.get("CHATBOT_BASE_URL").rstrip("/")
    model = current_app.config.get("CHATBOT_MODEL")
    payload = {
        "model": model,
        "messages": messages,
        "temperature": current_app.config.get("CHATBOT_TEMPERATURE", 0.6),
        "max_tokens": current_app.config.get("CHATBOT_MAX_TOKENS", 1024),
        "stream": True,
    }
    effort = current_app.config.get("CHATBOT_REASONING_EFFORT")
    if effort:
        payload["reasoning_effort"] = effort

    request = urllib.request.Request(
        f"{base_url}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=current_app.config.get("CHATBOT_TIMEOUT", 120)) as response:
            content_parts = []
            reasoning_parts = []
            for raw_line in response:
                line = raw_line.decode("utf-8", "replace").strip()
                if not line or not line.startswith("data:"):
                    continue
                chunk = line[len("data:"):].strip()
                if chunk == "[DONE]":
                    break
                try:
                    event = json.loads(chunk)
                except ValueError:
                    continue
                for choice in (event.get("choices") or []):
                    delta = choice.get("delta") or {}
                    if delta.get("content"):
                        content_parts.append(delta["content"])
                    if delta.get("reasoning_content"):
                        reasoning_parts.append(delta["reasoning_content"])
            reply = "".join(content_parts).strip() or "".join(reasoning_parts).strip()
            return reply or None
    except Exception:
        return None


def _llm_reply(user_id, message, page_hint=None):
    try:
        context = _student_context(user_id)
    except Exception:
        context = "Student data is temporarily unavailable." if user_id else "Guest context unavailable."

    history = _recent_history(user_id)
    if history and history[-1]["role"] == "user" and history[-1]["content"] == message:
        history = history[:-1]

    sys = SYSTEM_PROMPT + "\n\nStudent/live context:\n" + context
    if page_hint:
        sys += "\n\nUser is currently on: " + page_hint

    messages = [{"role": "system", "content": sys}] + history + [{"role": "user", "content": message}]
    return _call_nim(messages)


# =========================================================
# FALLBACK (guest-friendly)
# =========================================================

def _rule_based_reply(user_id, text, page_hint=None):
    t = text.lower()
    if not t:
        return ("Please type a question and I will do my best to help.", "empty")

    if _contains(t, "hello", "hey", "good morning", "good afternoon", "good evening", "hi"):
        return (
            "Hello! I'm **CampusConnect AI** — your guide for the CampusConnect portal. "
            "Ask me what any page does, say **\"take me to …\"**, or ask about the project.",
            "greeting"
        )
    if _contains(t, "thank"):
        return ("You're welcome! Happy to help.", "thanks")
    if _contains(t, "bye", "goodbye", "see you"):
        return ("Goodbye! 👋 I'll be here whenever you need me.", "bye")

    if _contains(t, "project", "campusconnect", "synopsis", "idea"):
        return (
            "**CampusConnect — AI College Companion** is a BCA final-year project.\n\n"
            "• Students: attendance, timetable, assignments, exams, results, courses, faculty, "
            "placements, documents, complaints, feedback, lost & found, events, campus, notifications\n"
            "• AI: me, in every page — answer using data via NVIDIA GPT-OSS model or built-in guide\n"
            "• Roles: Student, Faculty, Admin\n"
            "• Tech: HTML/CSS/JS + Flask + MySQL + JWT",
            "project"
        )

    if _contains(t, "page", "section") and page_hint:
        return (f"You're on **{page_hint}** page. Ask me **'what is this page for?'** for a detailed guide.", "page")
    return ("Ask me about any CampusConnect page, navigation, or the project — I'll guide you.", "fallback")


# =========================================================
# ENTRY
# =========================================================

def generate_reply(user_id, message, page_hint=None):
    text = (message or "").lower().strip()
    if not text:
        return ("Please type a question and I will do my best to help.", "empty")
    reply = _llm_reply(user_id, text, page_hint)
    if reply:
        return (reply, "llm")
    return _rule_based_reply(user_id, text, page_hint)
