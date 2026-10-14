# SYNOPSIS

## CampusConnect — AI College Companion (Smart Student Portal)

**Course:** BCA (Bachelor of Computer Applications)

---

## 1. Title of the Project

**CampusConnect** — A web-based "AI College Companion" that brings a student's entire campus life into one place: academics, attendance, timetable, exams, assignments, events, placements, faculty, results, complaints, lost & found, documents, notifications, feedback and campus information.

## 2. Introduction

Students today rely on many separate channels — notice boards, portals, WhatsApp groups, paper records — to track their academics and campus activities. Information is scattered, inconsistent, and easy to miss.

CampusConnect solves this by providing a **single integrated student portal**. The system is built as a **Flask (Python) REST API backend** with a **MySQL database**, exposing JSON endpoints that a frontend (HTML/CSS/JavaScript) consumes. The architecture cleanly separates a **backend API** (this project's focus) from the static frontend pages, so every module is data-driven and can be extended independently.

The project name in code and docs is **CampusConnect**; it is described in the UI as an "AI College Companion" and is intended to eventually include an intelligent chatbot assistant for students.

## 3. Objectives

- Provide a **single login** for students to access all campus features and their personal academic data.
- **Digitise student records** — courses, attendance, timetable, exam schedules, results, assignments — in a central MySQL database.
- Keep students **informed in real time** via announcements, notifications, event listings and placement opportunities.
- Let students **act** — submit assignments, raise complaints, post lost & found items, give feedback — instead of just reading.
- Expose a **clean, secure REST API** (JSON, proper HTTP status codes, password hashing) that any client can use.
- Lay the foundation for an **AI chatbot** that answers student questions from the campus database.

## 4. Scope

The scope of the project is a **backend REST API + database** for a college student portal, covering:

1. **Authentication** — student registration and login (email + hashed password).
2. **Academic modules** — courses/syllabus, attendance, timetable, assignments (with submission), exam schedules, results.
3. **Campus modules** — faculty directory, events, announcements, campus facilities, documents/library.
4. **Student services** — placements/jobs, complaints, feedback, lost & found, notifications, profile and user settings.
5. **Admin/management** — administration endpoints for managing the above data (planned).
6. **AI chatbot** — a rule/retrieval-based assistant backed by stored conversations (planned).

**Out of scope:** the frontend UI is a separate static codebase; this document covers the backend that powers it.

## 5. Modules of the Project

### 5.1 Backend API modules (routes)

| # | Module | Route prefix (planned) | Status |
|---|--------|------------------------|--------|
| 1 | Authentication | `/api/auth` | ✅ Implemented — register, login |
| 2 | Courses / Academics | `/api/courses` | ⚠️ Implemented but blocked by a syntax error + schema mismatch |
| 3 | Students / Profile | `/api/students` | 🔴 Not implemented |
| 4 | Attendance | `/api/attendance` | 🔴 Not implemented |
| 5 | Assignments | `/api/assignments` | 🔴 Not implemented |
| 6 | Timetable | `/api/timetable` | 🔴 Not implemented |
| 7 | Exams | `/api/exams` | 🔴 Not implemented |
| 8 | Events | `/api/events` | 🔴 Not implemented |
| 9 | Placement | `/api/placement` | 🔴 Not implemented |
| 10 | Notifications | `/api/notifications` | 🔴 Not implemented |
| 11 | Library / Documents | `/api/library` | 🔴 Not implemented |
| 12 | Lost & Found | `/api/lost-found` | 🔴 Not implemented |
| 13 | Applications | `/api/applications` | 🔴 Not implemented |
| 14 | Admin | `/api/admin` | 🔴 Not implemented |
| 15 | Academics (results/faculty/campus/settings/feedback/complaints) | `/api/academics` + related | 🔴 Not implemented |
| 16 | Chatbot | `/api/chatbot` (planned) | 🔴 Not implemented |

*(An `academics` route file also exists but is empty; module 1–3 correspond to `auth.py` and `courses.py` which contain the only written logic.)*

### 5.2 Support layers

- **`database/`** — DB connection helpers (`db.py`) + full schema (`schema.sql`) + setup script (`setup_schema.py`).
- **`models/`** — intended ORM-style models; only a broken SQLAlchemy leftover for `courses` exists (all others empty). The project uses **raw SQL** instead.
- **`services/`** — intended business services: `chatbot_service`, `notification_service`, `reminder_service` — all empty (planned).
- **`utils/helpers.py`** — planned shared helpers (empty).

## 6. Technology Stack

| Layer | Technology |
|---|---|
| Language | Python 3.13 |
| Web framework | Flask 3.1 (with CORS via Flask-CORS) |
| Database | MySQL (database `campusconnect`) |
| DB driver | `mysql-connector-python` |
| Password security | Werkzeug `generate_password_hash` / `check_password_hash` (PBKDF2) |
| Config / env | `python-dotenv` (`.env` file) |
| Token auth (planned) | PyJWT *2.13* and bcrypt *5.0* are installed but not yet used |
| Frontend (separate) | Static HTML/CSS/JavaScript — consumes the JSON API |

## 7. Database Design

Database name: **`campusconnect`** — 18 tables defined in `backend/database/schema.sql`:

- `users` — students (name, email, password hash, student_id, course, semester, phone, profile_image)
- `courses` — course catalogue
- `assignments` — per-student assignment tracking + submission file
- `attendance` — per-student, per-course attendance (Present/Absent/Late)
- `timetable` — day/time slots, room, faculty per course
- `events` — campus events (date, time, location, category, image)
- `exams` — exam schedule per student/course
- `notifications` — per-student alerts (read/unread)
- `placements` — company / job / deadline listings
- `chatbot_messages` — user/bot conversation log
- `faculty` — faculty directory
- `results` — marks, grade, status per student
- `documents` — user-uploaded document metadata
- `complaints` — grievance submissions + admin response
- `feedback` — ratings and messages
- `lost_found` — item reports
- `campus` — campus facilities info
- `user_settings` — notifications/dark-mode/language preferences

Most student-bound tables use foreign keys to `users(id)` (`ON DELETE CASCADE`).

> **Note:** `courses` is defined twice in `schema.sql` with different columns; the duplicates must be reconciled before the Courses API can work.

## 8. Current Development Status

- ✅ **Working:** DB connection layer; full 18-table schema; Auth API (register + login with hashing); Courses API logic; app health check at `/`.
- 🔴 **Blocking bugs (server will not start / DB setup will not run):**
  1. `routes/courses.py` line 1 contains `python app.py` → `SyntaxError`.
  2. `setup_schema.py` line 58 `continue=` → `SyntaxError`.
  3. `routes/attendance.py` contains only a stray `\` → `SyntaxError`.
  4. `models/courses.py` is a broken SQLAlchemy leftover (`from app import db`, markdown fences) → `IndentationError`.
  5. Empty `config.py` and empty root `requirements.txt`.
  6. The bundled `venv/` points to another machine's Python path and is unusable; it must be recreated.
- 🔴 **Not implemented:** 13 of 15 API modules, all services, all helpers, JWT/roles, file uploads, chatbot.
- ⚠️ **Frontend:** static pages exist for every module, but only Registration and Academics currently call the API; the rest run on mock/local data. *(Frontend is out of scope for the backend work.)*

## 9. Future Scope / Enhancements

- JWT-based authentication and role-based access (student / admin / faculty).
- Full admin panel endpoints to manage courses, events, placements and complaints.
- AI chatbot answering queries from the campus database; scheduled email/notification reminders for assignments and exams.
- File upload handling for assignment submissions and documents.
- Results with GPA calculation; notifications (in-app + email).
- Deployment to a cloud host with a managed MySQL instance.

## 10. Conclusion

CampusConnect consolidates a college student's daily academic and campus needs into one portal backed by a well-structured MySQL schema. The database design and core Auth/Courses APIs are in place; completing the remaining module APIs, fixing the boot-blocking bugs, and adding JWT security will turn the project into a fully functional student companion platform.