import pytest
from src.app.crud.user import get_user_by_email

def _make_admin(client, db, email="admin@example.com", password="password"):
    client.post("/api/auth/register", json={"email": email, "password": password})
    user = get_user_by_email(db, email)
    user.role = "admin"
    db.commit()
    login_res = client.post("/api/auth/login", data={"username": email, "password": password})
    return login_res.json()["access_token"]

def test_admin_access_summary(client, db):
    token = _make_admin(client, db)
    response = client.get("/api/admin/summary", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200

def test_submitter_denied_summary(client):
    email = "sub@example.com"
    client.post("/api/auth/register", json={"email": email, "password": "password"})
    login_res = client.post("/api/auth/login", data={"username": email, "password": "password"})
    token = login_res.json()["access_token"]
    response = client.get("/api/admin/summary", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403

def test_get_admin_stats_empty(client, db):
    """Admin stats on empty DB should return all zeros."""
    token = _make_admin(client, db, "stats_admin@example.com")
    resp = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 0
    assert data["accepted"] == 0
    assert data["rejected"] == 0
    assert data["acceptance_rate"] == 0.0
    assert data["daily_submissions"] == []

def test_get_admin_stats_forbidden_for_submitter(client):
    """Submitter cannot access admin stats."""
    email = "submitter_stats@example.com"
    client.post("/api/auth/register", json={"email": email, "password": "password"})
    login_res = client.post("/api/auth/login", data={"username": email, "password": "password"})
    token = login_res.json()["access_token"]
    resp = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403
