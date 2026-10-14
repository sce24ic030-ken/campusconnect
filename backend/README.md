# CampusConnect — Backend API

Flask + MySQL REST API for the **CampusConnect / AI College Companion** project.
The frontend is a separate static site; this folder contains **only the backend**.

---

## Tech stack

| Layer      | Choice                                             |
| ---------- | -------------------------------------------------- |
| Language   | Python 3.12                                        |
| Framework  | Flask 3.1                                          |
| Database   | MySQL 8 (raw SQL, no ORM)                          |
| DB driver  | `mysql-connector-python`                           |
| Auth       | JWT (`PyJWT`), passwords hashed with `Werkzeug`    |
| Config     | `python-dotenv` (`.env` file)                      |
| Server     | Werkzeug (dev) / gunicorn (production)             |

---

## Requirements

- Python 3.12+
- MySQL 8 running locally (default port `3306`)

---

## Setup (Windows / PowerShell)

```powershell
cd BCA\backend

# 1. Create and activate a virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create your .env from the example and fill in your MySQL password
Copy-Item .env.example .env
notepad .env

# 4. Create the database and tables
python setup_schema.py

# 5. Run the server
python app.py
```

The API is then available at **http://127.0.0.1:5000**.

---

## Configuration (`.env`)

| Key               | Description                          |
| ----------------- | ------------------------------------ |
| `DB_HOST`         | MySQL host (e.g. `localhost`)        |
| `DB_USER`         | MySQL user (e.g. `root`)             |
| `DB_PASSWORD`     | MySQL password (empty for local dev) |
| `DB_NAME`         | Database name (`campusconnect`)      |
| `FLASK_ENV`       | `development` or `production`        |
| `FLASK_DEBUG`     | `True` / `False`                     |
| `SECRET_KEY`      | Flask secret key                     |
| `JWT_SECRET`      | Secret used to sign JWT tokens       |
| `JWT_EXPIRY_HOURS`| Token lifetime in hours (default 24) |
| `CORS_ORIGINS`    | Allowed CORS origins, or `*` (default) |
| `NVIDIA_API_KEY`  | NVIDIA NIM key for the chatbot (secret) |
| `CHATBOT_MODEL`   | Chatbot model (default `openai/gpt-oss-20b`) |
| `CHATBOT_TIMEOUT` | LLM request timeout in seconds (default 30) |
| `CHATBOT_REASONING_EFFORT` | Reasoning effort (default `low`) |

> `.env` is git-ignored. Never commit it.

---

## Project structure

```
backend/
├── app.py                  # App factory, blueprint registration, JSON provider
├── wsgi.py                 # WSGI entry point (production)
├── config.py               # Configuration classes
├── setup_schema.py         # Creates the database + tables from schema.sql
├── requirements.txt        # Runtime dependencies
├── requirements-dev.txt    # Dev dependencies (pytest)
├── Procfile                # gunicorn start command
├── database/
│   ├── db.py               # Connection + query helpers (query_all/one, execute)
│   └── schema.sql          # Full MySQL schema + sample data
├── models/
│   └── courses.py          # Data-access layer for courses
├── routes/                 # One blueprint per feature area
├── services/               # chatbot, notification, reminder services
├── utils/
│   ├── helpers.py          # success()/error() JSON helpers
│   ├── security.py         # JWT + @token_required / @admin_required
│   └── validators.py       # date/time/int validators
└── tests/
    ├── test_smoke.py       # pytest smoke tests
    └── e2e_api_test.ps1    # Full end-to-end API test (PowerShell)
```

Database access is centralised in `database/db.py`
(`query_all`, `query_one`, `execute`) and used directly by the route modules.
`models/courses.py` provides a small data-access layer for courses.

---

## Authentication

1. `POST /api/auth/register` — create an account (JSON: `name`, `email`, `password`).
2. `POST /api/auth/login` — returns a `token` and the `user` object.
3. Send the token on protected requests:

```
Authorization: Bearer <token>
```

Two decorators guard routes:

- `@token_required` — a valid JWT is required; sets `request.user_id` / `request.user_role`.
- `@admin_required` — additionally requires `role = 'admin'`.

New users get the role `student`. Promote a user to admin directly in MySQL:

```sql
UPDATE campusconnect.users SET role = 'admin' WHERE email = 'you@example.com';
```

---

## API reference

### Auth — `/api/auth`
| Method | Path        | Auth | Description           |
| ------ | ----------- | ---- | --------------------- |
| POST   | `/register` | –    | Register a new user   |
| POST   | `/login`    | –    | Log in, returns JWT   |

### Students / profile — `/api/students`
| Method | Path        | Auth  | Description                 |
| ------ | ----------- | ----- | --------------------------- |
| GET    | `/me`       | token | My profile                  |
| PUT    | `/me`       | token | Update my profile           |
| GET    | ``          | admin | List all students           |
| GET    | `/<id>`     | admin | Get one student             |

### Settings — `/api/settings`
| Method | Path | Auth  | Description        |
| ------ | ---- | ----- | ------------------ |
| GET    | ``   | token | Get my settings    |
| PUT    | ``   | token | Update my settings |

### Courses — `/api/courses` (public)
| Method | Path              | Description                          |
| ------ | ----------------- | ------------------------------------ |
| GET    | ``                | List courses (`?program=&semester=`) |
| GET    | `/<id>`           | Get one course                       |

### Attendance — `/api/attendance`
| Method | Path        | Auth  | Description                    |
| ------ | ----------- | ----- | ------------------------------ |
| GET    | ``          | token | My attendance (`?course_id=&status=&from=&to=`) |
| GET    | `/summary`  | token | Percentage per course + overall |
| GET    | `/<id>`     | token | One record                      |
| POST   | ``          | token | Record attendance               |
| PUT    | `/<id>`     | token | Update record                   |
| DELETE | `/<id>`     | token | Delete record                   |

### Timetable — `/api/timetable`
| Method | Path    | Auth  | Description        |
| ------ | ------- | ----- | ------------------ |
| GET    | ``      | token | My timetable (`?day=`) |
| GET    | `/<id>` | token | One entry          |
| POST   | ``      | token | Create entry       |
| PUT    | `/<id>` | token | Update entry       |
| DELETE | `/<id>` | token | Delete entry       |

### Assignments — `/api/assignments`
| Method | Path           | Auth  | Description     |
| ------ | -------------- | ----- | --------------- |
| GET    | ``             | token | My assignments (`?status=`) |
| GET    | `/<id>`        | token | One assignment  |
| POST   | ``             | token | Create          |
| PUT    | `/<id>`        | token | Update          |
| POST   | `/<id>/submit` | token | Mark submitted  |
| DELETE | `/<id>`        | token | Delete          |

### Exams — `/api/exams`
| Method | Path    | Auth  | Description            |
| ------ | ------- | ----- | ---------------------- |
| GET    | ``      | token | My exams (`?upcoming=1`) |
| GET    | `/<id>` | token | One exam               |
| POST   | ``      | token | Create                 |
| PUT    | `/<id>` | token | Update                 |
| DELETE | `/<id>` | token | Delete                 |

### Results — `/api/results`
| Method | Path        | Auth  | Description             |
| ------ | ----------- | ----- | ----------------------- |
| GET    | ``          | token | My results (`?semester=`) |
| GET    | `/summary`  | token | GPA + average           |
| GET    | `/<id>`     | token | One result              |
| POST   | ``          | admin | Create                  |
| PUT    | `/<id>`     | admin | Update                  |
| DELETE | `/<id>`     | admin | Delete                  |

### Events — `/api/events`
| Method | Path    | Auth  | Description                  |
| ------ | ------- | ----- | ---------------------------- |
| GET    | ``      | –     | List (`?category=&upcoming=1`) |
| GET    | `/<id>` | –     | One event                    |
| POST   | ``      | admin | Create                       |
| PUT    | `/<id>` | admin | Update                       |
| DELETE | `/<id>` | admin | Delete                       |

### Faculty — `/api/faculty`
| Method | Path    | Auth  | Description              |
| ------ | ------- | ----- | ------------------------ |
| GET    | ``      | –     | List (`?department=`)    |
| GET    | `/<id>` | –     | One faculty member       |
| POST   | ``      | admin | Create                   |
| PUT    | `/<id>` | admin | Update                   |
| DELETE | `/<id>` | admin | Delete                   |

### Campus — `/api/campus`
| Method | Path    | Auth  | Description            |
| ------ | ------- | ----- | ---------------------- |
| GET    | ``      | –     | List (`?category=`)    |
| GET    | `/<id>` | –     | One facility           |
| POST   | ``      | admin | Create                 |
| PUT    | `/<id>` | admin | Update                 |
| DELETE | `/<id>` | admin | Delete                 |

### Placements — `/api/placements`
| Method | Path    | Auth  | Description                     |
| ------ | ------- | ----- | ------------------------------- |
| GET    | ``      | –     | List (`?q=&open=1`)             |
| GET    | `/<id>` | –     | One placement                   |
| POST   | ``      | admin | Create                          |
| PUT    | `/<id>` | admin | Update                          |
| DELETE | `/<id>` | admin | Delete                          |

### Applications — `/api/applications`
| Method | Path    | Auth  | Description                          |
| ------ | ------- | ----- | ------------------------------------ |
| GET    | ``      | token | My applications (`?all=1` for admin) |
| GET    | `/<id>` | token | One application                      |
| POST   | ``      | token | Apply (`placement_id`, `cover_note`) |
| PUT    | `/<id>` | admin | Update status                        |
| DELETE | `/<id>` | token | Withdraw                             |

### Notifications — `/api/notifications`
| Method | Path             | Auth  | Description              |
| ------ | ---------------- | ----- | ------------------------ |
| GET    | ``               | token | My notifications (`?unread=1`) |
| GET    | `/unread-count`  | token | Unread count             |
| PUT    | `/<id>/read`     | token | Mark one as read         |
| PUT    | `/read-all`      | token | Mark all as read         |
| POST   | ``               | admin | Create for one user      |
| POST   | `/broadcast`     | admin | Send to all students     |
| DELETE | `/<id>`          | token | Delete                   |

### Library / documents — `/api/library`
| Method | Path               | Auth  | Description                     |
| ------ | ------------------ | ----- | ------------------------------- |
| GET    | `/documents`       | token | My documents                    |
| GET    | `/documents/<id>`  | token | One document                    |
| POST   | `/documents`       | token | Add (JSON or multipart `file`)  |
| DELETE | `/documents/<id>`  | token | Delete                          |

### Lost & found — `/api/lost-found`
| Method | Path    | Auth  | Description                                |
| ------ | ------- | ----- | ------------------------------------------ |
| GET    | ``      | –     | List (`?item_type=&status=&q=`)            |
| GET    | `/<id>` | –     | One item                                   |
| POST   | ``      | token | Report an item                             |
| PUT    | `/<id>` | token | Update (owner or admin)                    |
| DELETE | `/<id>` | token | Delete (owner or admin)                    |

### Complaints — `/api/complaints`
| Method | Path    | Auth  | Description                       |
| ------ | ------- | ----- | --------------------------------- |
| GET    | ``      | token | Mine (`?all=1&status=` for admin) |
| GET    | `/<id>` | token | One complaint                     |
| POST   | ``      | token | Submit a complaint                |
| PUT    | `/<id>` | admin | Respond / change status           |
| DELETE | `/<id>` | admin | Delete                            |

### Feedback — `/api/feedback`
| Method | Path        | Auth  | Description         |
| ------ | ----------- | ----- | ------------------- |
| POST   | ``          | token | Submit feedback     |
| GET    | ``          | token | My feedback         |
| GET    | `/summary`  | admin | Average + recent    |

### Admin — `/api/admin`
| Method | Path                    | Auth  | Description          |
| ------ | ----------------------- | ----- | -------------------- |
| GET    | `/stats`                | admin | Dashboard counts     |
| GET    | `/users`                | admin | List users (`?role=`) |
| PUT    | `/users/<id>/role`      | admin | Change a user's role |
| DELETE | `/users/<id>`           | admin | Delete a user        |

### Academics — `/api/academics`
| Method | Path        | Auth  | Description                       |
| ------ | ----------- | ----- | --------------------------------- |
| GET    | `/overview` | token | Dashboard aggregate for a student |

### Chatbot — `/api/chatbot`
| Method | Path        | Auth  | Description                    |
| ------ | ----------- | ----- | ------------------------------ |
| POST   | `/message`  | token | Send a message, get a reply    |
| GET    | `/history`  | token | My chat history                |
| DELETE | `/history`  | token | Clear my chat history          |

The chatbot tries **GPT-OSS 20B** on the NVIDIA NIM API
(`https://integrate.api.nvidia.com/v1`) first, feeding it the student's live
data (attendance, assignments, exams, timetable) so it can guide them in-app.
The reply is returned in `data.reply` (with `data.intent = "llm"`). If
`NVIDIA_API_KEY` is unset, or the model errors/times out, it falls back to a
built-in rule-based assistant, so the endpoint always answers.

---

## Testing

**pytest smoke tests**

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
python -m pytest tests -q
```

**Full end-to-end test** (starts against a running server on port 5000)

```powershell
python app.py                 # in one terminal
powershell -File tests\e2e_api_test.ps1   # in another
```

The E2E script exercises every module (auth, profile, settings, courses,
attendance, timetable, assignments, exams, results, events, faculty, campus,
placements, applications, notifications, library, lost & found, complaints,
feedback, admin, academics and the chatbot).

---

## Deployment

### PythonAnywhere (free tier)

1. Upload the `backend` folder (or clone your repo).
2. Create a virtualenv and `pip install -r requirements.txt`.
3. Add a **MySQL** database from the *Databases* tab, then set those values in `.env`.
4. `python setup_schema.py` to create the tables.
5. Create a **Web app** (Manual config → Flask) and point the WSGI file at `wsgi.py`:

   ```python
   import sys
   path = "/home/<username>/BCA/backend"
   if path not in sys.path:
       sys.path.insert(0, path)
   from app import app as application
   ```

6. Reload the web app.

### Render / other hosts

- Build: `pip install -r requirements.txt`
- Start: `gunicorn app:app` (already in the `Procfile`)
- Use a managed MySQL (e.g. Aiven free tier) and set the DB variables in the
  host's environment settings.

> In production set `FLASK_ENV=production`, `FLASK_DEBUG=False`, and strong
> `SECRET_KEY` / `JWT_SECRET` values.

---

## Notes

- The `/api/courses` endpoint returns a **plain JSON array** (the frontend
  consumes it directly). Every other endpoint returns an envelope:
  `{"success": true, "data": ...}` or `{"success": false, "message": ...}`.
- Dates are returned as `YYYY-MM-DD`, times as `HH:MM:SS`.
- The `models/` folder still contains the original empty placeholder files;
  all data access lives in `database/db.py`, the route modules and
  `models/courses.py`.
