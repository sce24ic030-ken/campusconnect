"""End-to-end API checks for the auth + profile changes.

Creates a throwaway admin and student, exercises the endpoints, then removes
everything it created.  Run from the backend directory with the project venv.
"""

import json
import sys
import time
import urllib.error
import urllib.request

from werkzeug.security import generate_password_hash

from database.db import get_connection

BASE = "http://127.0.0.1:5050"
STAMP = str(int(time.time()))
STUDENT_EMAIL = "apitest.student.{}@example.com".format(STAMP)
STUDENT_ID = "APIT{}".format(STAMP[-6:])
ADMIN_EMAIL = "apitest.admin.{}@example.com".format(STAMP)
PASSWORD = "Test@12345"

results = []


def check(label, condition, detail=""):
    results.append((label, bool(condition), detail))
    print("{:<58} {}".format(label, "PASS" if condition else "FAIL " + str(detail)))


def request(method, path, body=None, token=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode() or "{}")
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode()
        try:
            return exc.code, json.loads(raw or "{}")
        except ValueError:
            return exc.code, {"raw": raw}


def make_users():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO users (name, email, password, student_id, course, semester, phone, role) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
        ("API Admin", ADMIN_EMAIL, generate_password_hash(PASSWORD), None, None, None, None, "admin"),
    )
    cur.execute(
        "INSERT INTO users (name, email, password, student_id, course, semester, phone, role) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
        ("API Student", STUDENT_EMAIL, generate_password_hash(PASSWORD), STUDENT_ID, "BCA", 5, "9000000000", "student"),
    )
    conn.commit()
    cur.execute("SELECT id FROM users WHERE email = %s", (STUDENT_EMAIL,))
    student_id = cur.fetchone()[0]
    cur.execute("SELECT id FROM users WHERE email = %s", (ADMIN_EMAIL,))
    admin_id = cur.fetchone()[0]
    cur.close()
    conn.close()
    return student_id, admin_id


def cleanup():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM users WHERE email IN (%s, %s)", (STUDENT_EMAIL, ADMIN_EMAIL))
    removed = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()
    print("\ncleanup: removed {} test users".format(removed))


def main():
    student_pk, admin_pk = make_users()
    print("created test student pk={} admin pk={}\n".format(student_pk, admin_pk))

    # ---- login by email ------------------------------------------------
    status, body = request("POST", "/api/auth/login", {"email": STUDENT_EMAIL, "password": PASSWORD})
    check("login by email -> 200", status == 200, status)
    check("login returns token", bool(body.get("token")), body)
    check("login returns user without password", "password" not in (body.get("user") or {}), body.get("user"))
    student_token = body.get("token")

    # ---- login by student id -------------------------------------------
    status, body = request("POST", "/api/auth/login", {"email": STUDENT_ID, "password": PASSWORD})
    check("login by student_id -> 200", status == 200, status)
    check("student_id login returns token", bool(body.get("token")), body)

    # ---- wrong password -------------------------------------------------
    status, _ = request("POST", "/api/auth/login", {"email": STUDENT_EMAIL, "password": "nope"})
    check("wrong password -> 401", status == 401, status)

    # ---- register via the new contract ---------------------------------
    new_email = "apitest.reg.{}@example.com".format(STAMP)
    status, body = request("POST", "/api/auth/register", {
        "name": "Register Test", "student_id": "APITR{}".format(STAMP[-5:]),
        "email": new_email, "phone": "9000000011", "course": "BBA",
        "semester": 2, "password": PASSWORD,
    })
    check("register -> 201", status == 201, "{} {}".format(status, body))
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM users WHERE email = %s", (new_email,))
    removed = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()
    check("register persisted to DB", removed == 1, removed)

    # ---- profile read ---------------------------------------------------
    status, body = request("GET", "/api/students/me", token=student_token)
    student = body.get("data") or {}
    check("GET /api/students/me -> 200", status == 200, status)
    check("profile has course BCA", student.get("course") == "BCA", student.get("course"))

    # ---- self-service: name/phone ok, course/semester locked -----------
    status, body = request("PUT", "/api/students/me", {
        "name": "Renamed Student", "phone": "9111111111",
        "course": "BBA", "semester": 2,
    }, token=student_token)
    updated = body.get("data") or {}
    check("PUT /api/students/me -> 200", status == 200, "{} {}".format(status, body))
    check("name updated", updated.get("name") == "Renamed Student", updated.get("name"))
    check("phone updated", updated.get("phone") == "9111111111", updated.get("phone"))
    check("course LOCKED (still BCA)", updated.get("course") == "BCA", updated.get("course"))
    check("semester LOCKED (still 5)", str(updated.get("semester")) == "5", updated.get("semester"))

    # ---- self-service: no editable fields ------------------------------
    status, _ = request("PUT", "/api/students/me", {"course": "BBA"}, token=student_token)
    check("PUT with only locked fields -> 400", status == 400, status)

    # ---- admin route ----------------------------------------------------
    status, body = request("POST", "/api/auth/login", {"email": ADMIN_EMAIL, "password": PASSWORD})
    admin_token = body.get("token")
    check("admin login -> 200", status == 200, status)

    status, body = request("PUT", "/api/students/{}".format(student_pk), {
        "course": "BCOM", "semester": 3, "name": "Admin Edited",
    }, token=admin_token)
    edited = body.get("data") or {}
    check("admin PUT /api/students/<id> -> 200", status == 200, "{} {}".format(status, body))
    check("admin changed course to BCOM", edited.get("course") == "BCOM", edited.get("course"))
    check("admin changed semester to 3", str(edited.get("semester")) == "3", edited.get("semester"))
    check("admin changed name", edited.get("name") == "Admin Edited", edited.get("name"))

    # ---- student cannot use the admin route ----------------------------
    status, _ = request("PUT", "/api/students/{}".format(student_pk), {"name": "Hack"}, token=student_token)
    check("student PUT /api/students/<id> -> 403", status == 403, status)

    # ---- student cannot list students ----------------------------------
    status, _ = request("GET", "/api/students", token=student_token)
    check("student GET /api/students -> 403", status == 403, status)

    # ---- academics data per programme ---------------------------------
    for program, expected in (("BCA", 30), ("BBA", 30), ("BCOM", 30)):
        status, body = request("GET", "/api/courses?program=" + program)
        rows = body if isinstance(body, list) else body.get("data") or []
        check("GET /api/courses?program={} -> {}".format(program, expected), len(rows) == expected, len(rows))

    cleanup()

    failed = [r for r in results if not r[1]]
    print("\n{} checks, {} failed".format(len(results), len(failed)))
    if failed:
        for label, _, detail in failed:
            print("  FAILED: {} ({})".format(label, detail))
        sys.exit(1)


if __name__ == "__main__":
    main()
