# =========================================================
# SMOKE TESTS
# These run against the configured MySQL database (see .env).
#   python -m pytest tests -q
# =========================================================

import time

import pytest

from app import create_app


@pytest.fixture(scope="module")
def client():
    app = create_app()
    app.config.update(TESTING=True)
    return app.test_client()


def unique_email(prefix="pytest"):
    return f"{prefix}{int(time.time() * 1000)}@campusconnect.com"


def register_and_token(client, prefix="pytest"):
    email = unique_email(prefix)
    client.post(
        "/api/auth/register",
        json={"name": "Py Test", "email": email, "password": "secret123"}
    )
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": "secret123"}
    )
    return response.get_json()["token"], email


def test_health(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.get_json()["success"] is True


def test_register_login_and_profile(client):
    token, email = register_and_token(client)

    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/students/me", headers=headers)
    assert response.status_code == 200
    assert response.get_json()["data"]["email"] == email


def test_protected_requires_token(client):
    response = client.get("/api/students/me")
    assert response.status_code == 401


def test_courses_public(client):
    response = client.get("/api/courses")
    assert response.status_code == 200
    assert isinstance(response.get_json(), list)


def test_attendance_flow(client):
    token, _ = register_and_token(client, "att")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/attendance",
        json={"attendance_date": "2026-01-15", "status": "Present"},
        headers=headers
    )
    assert response.status_code == 201
    record_id = response.get_json()["data"]["id"]

    response = client.get("/api/attendance/summary", headers=headers)
    assert response.status_code == 200

    response = client.delete(f"/api/attendance/{record_id}", headers=headers)
    assert response.status_code == 200


def test_chatbot_replies(client):
    token, _ = register_and_token(client, "chat")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/chatbot/message",
        json={"message": "hello"},
        headers=headers
    )
    assert response.status_code == 200
    assert response.get_json()["data"]["reply"]
