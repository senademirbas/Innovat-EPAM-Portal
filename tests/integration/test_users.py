"""
Integration tests for the new /api/users/* endpoints.
Tests: GET /users/me/stats, PUT /users/me/password
"""
import pytest

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def register_and_login(client, email="user@test.com", password="Password1!"):
    client.post("/api/auth/register", json={"email": email, "password": password})
    resp = client.post("/api/auth/login", data={"username": email, "password": password})
    return resp.json()["access_token"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# GET /api/users/me/stats
# ---------------------------------------------------------------------------
def test_get_user_stats_empty(client):
    """A new user with no ideas should get zeroed-out stats."""
    token = register_and_login(client)
    resp = client.get("/api/users/me/stats", headers=auth_headers(token))
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 0
    assert data["accepted"] == 0
    assert data["rejected"] == 0
    assert data["success_rate"] == 0.0


def test_get_user_stats_unauthenticated(client):
    """Unauthenticated request should be rejected."""
    resp = client.get("/api/users/me/stats")
    assert resp.status_code == 401


def test_get_user_stats_with_ideas(client):
    """Stats should reflect submitted ideas correctly."""
    token = register_and_login(client, "stats_user@test.com")
    hdrs = auth_headers(token)

    # Submit 2 ideas
    for i in range(2):
        client.post(
            "/api/ideas",
            data={"title": f"Idea {i}", "category": "AI", "description": "A" * 15},
            headers=hdrs,
        )

    resp = client.get("/api/users/me/stats", headers=hdrs)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    assert data["pending"] == 2  # not yet evaluated
    assert data["success_rate"] == 0.0


# ---------------------------------------------------------------------------
# PUT /api/users/me/password
# ---------------------------------------------------------------------------
def test_change_password_success(client):
    """Valid current password + new password should succeed."""
    token = register_and_login(client, "pw_user@test.com", "OldPass1!")
    resp = client.put(
        "/api/users/me/password",
        json={"current_password": "OldPass1!", "new_password": "NewPass2!"},
        headers=auth_headers(token),
    )
    assert resp.status_code == 200
    assert "Password updated successfully" in resp.json()["message"]


def test_change_password_wrong_current(client):
    """Wrong current password should return 400."""
    token = register_and_login(client, "pw_bad@test.com", "RealPass1!")
    resp = client.put(
        "/api/users/me/password",
        json={"current_password": "WrongPass!", "new_password": "NewPass2!"},
        headers=auth_headers(token),
    )
    assert resp.status_code == 400
    assert "incorrect" in resp.json()["detail"].lower()


def test_change_password_same_as_current(client):
    """New password same as current should return 400."""
    token = register_and_login(client, "pw_same@test.com", "SamePass1!")
    resp = client.put(
        "/api/users/me/password",
        json={"current_password": "SamePass1!", "new_password": "SamePass1!"},
        headers=auth_headers(token),
    )
    assert resp.status_code == 400
    assert "differ" in resp.json()["detail"].lower()


def test_change_password_too_short(client):
    """New password < 8 chars should fail Pydantic validation."""
    token = register_and_login(client, "pw_short@test.com", "ValidPass1!")
    resp = client.put(
        "/api/users/me/password",
        json={"current_password": "ValidPass1!", "new_password": "short"},
        headers=auth_headers(token),
    )
    assert resp.status_code == 422  # Pydantic min_length
