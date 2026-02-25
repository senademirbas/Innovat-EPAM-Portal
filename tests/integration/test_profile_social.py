"""
test_profile_social.py — Integration tests for social profile endpoints.
    PUT /api/users/me/profile    → update social fields
    GET /api/users/{id}/profile  → public profile lookup
"""
import pytest

def _register_login(client, email="social@example.com", password="password"):
    client.post("/api/auth/register", json={"email": email, "password": password})
    res = client.post("/api/auth/login", data={"username": email, "password": password})
    return res.json()["access_token"]

def _auth(token):
    return {"Authorization": f"Bearer {token}"}

def _me(client, token):
    return client.get("/api/auth/me", headers=_auth(token)).json()


# ── PUT /users/me/profile ──────────────────────────────────────────────────────

def test_update_profile_sets_social_fields(client):
    token = _register_login(client, "upd_profile@example.com")
    resp = client.put(
        "/api/users/me/profile",
        json={
            "avatar_url": "https://example.com/avatar.png",
            "bio": "Senior Engineer",
            "github_link": "https://github.com/user",
            "linkedin_link": "https://linkedin.com/in/user",
        },
        headers=_auth(token),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["avatar_url"] == "https://example.com/avatar.png"
    assert data["bio"] == "Senior Engineer"
    assert data["github_link"] == "https://github.com/user"
    assert data["linkedin_link"] == "https://linkedin.com/in/user"


def test_update_profile_partial_update(client):
    """Partial update — only bio set, other social fields remain null."""
    token = _register_login(client, "partial_profile@example.com")
    resp = client.put("/api/users/me/profile", json={"bio": "Only bio"}, headers=_auth(token))
    assert resp.status_code == 200
    data = resp.json()
    assert data["bio"] == "Only bio"
    assert data["avatar_url"] is None
    assert data["github_link"] is None


def test_update_profile_requires_auth(client):
    resp = client.put("/api/users/me/profile", json={"bio": "Anon"})
    assert resp.status_code == 401


# ── GET /users/{user_id}/profile ──────────────────────────────────────────────

def test_get_public_profile_no_auth(client):
    """Public profile lookup does not require authentication."""
    token = _register_login(client, "public_profile@example.com")
    # Set some fields first
    client.put(
        "/api/users/me/profile",
        json={"bio": "Public bio", "github_link": "https://github.com/pub"},
        headers=_auth(token),
    )
    user = _me(client, token)
    user_id = user["id"]
    # Now look up without auth
    resp = client.get(f"/api/users/{user_id}/profile")
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "public_profile@example.com"
    assert data["bio"] == "Public bio"
    assert data["github_link"] == "https://github.com/pub"


def test_get_public_profile_not_found(client):
    resp = client.get("/api/users/nonexistent-id/profile")
    assert resp.status_code == 404
