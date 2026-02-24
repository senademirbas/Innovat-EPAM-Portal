import pytest
from src.app.crud.user import get_user_by_email

def test_admin_access_summary(client, db):
    email = "admin@example.com"
    # Register
    client.post("/auth/register", json={"email": email, "password": "password"})
    
    # Promote
    user = get_user_by_email(db, email)
    user.role = "admin"
    db.commit()
    
    # Login
    login_res = client.post("/auth/login", data={"username": email, "password": "password"})
    token = login_res.json()["access_token"]
    
    # Access Admin
    response = client.get("/admin/summary", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200

def test_submitter_denied_summary(client):
    email = "sub@example.com"
    client.post("/auth/register", json={"email": email, "password": "password"})
    
    login_res = client.post("/auth/login", data={"username": email, "password": "password"})
    token = login_res.json()["access_token"]
    
    response = client.get("/admin/summary", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403
