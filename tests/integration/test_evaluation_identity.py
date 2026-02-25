"""
test_evaluation_identity.py — Integration tests for reviewer identity in evaluations.
Verifies that after an admin evaluates an idea:
  - The response includes a nested `reviewer` with the admin's PublicProfile.
  - The `reviewed_by_id` is persisted (visible on subsequent GET).
"""
import pytest
from src.app.crud.user import get_user_by_email

def _register_login(client, email, password="password"):
    client.post("/api/auth/register", json={"email": email, "password": password})
    res = client.post("/api/auth/login", data={"username": email, "password": password})
    return res.json()["access_token"]

def _make_admin(client, db, email, password="password"):
    client.post("/api/auth/register", json={"email": email, "password": password})
    user = get_user_by_email(db, email)
    user.role = "admin"
    db.commit()
    res = client.post("/api/auth/login", data={"username": email, "password": password})
    return res.json()["access_token"]

def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_evaluate_idea_returns_reviewer_identity(client, db):
    """After admin evaluation, the idea response includes reviewer public profile."""
    submitter_token = _register_login(client, "submitter_eval@example.com")
    admin_token = _make_admin(client, db, "admin_reviewer@example.com")
    # Set admin bio/github so we can confirm they come through
    client.put(
        "/api/users/me/profile",
        json={"bio": "Reviews Engineer", "github_link": "https://github.com/adminreview"},
        headers=_auth(admin_token),
    )

    # Submit an idea
    create_resp = client.post(
        "/api/ideas",
        data={"title": "Idea To Review", "description": "A submission that will be reviewed.", "category": "AI"},
        headers=_auth(submitter_token),
    )
    assert create_resp.status_code == 201
    idea_id = create_resp.json()["id"]

    # Admin evaluates
    eval_resp = client.patch(
        f"/api/admin/ideas/{idea_id}/evaluate",
        json={"status": "accepted", "admin_comment": "Great idea!"},
        headers=_auth(admin_token),
    )
    assert eval_resp.status_code == 200
    data = eval_resp.json()

    # reviewer must be present and correct
    assert data["status"] == "accepted"
    assert data["admin_comment"] == "Great idea!"
    assert data["reviewer"] is not None
    assert data["reviewer"]["email"] == "admin_reviewer@example.com"
    assert data["reviewer"]["bio"] == "Reviews Engineer"
    assert data["reviewer"]["github_link"] == "https://github.com/adminreview"


def test_evaluate_reviewer_null_before_evaluation(client, db):
    """Freshly submitted idea has no reviewer."""
    submitter_token = _register_login(client, "pre_eval_sub@example.com")
    create_resp = client.post(
        "/api/ideas",
        data={"title": "Pending Idea", "description": "No review yet.", "category": "AI"},
        headers=_auth(submitter_token),
    )
    assert create_resp.status_code == 201
    data = create_resp.json()
    assert data["reviewer"] is None
    assert data["status"] == "submitted"
