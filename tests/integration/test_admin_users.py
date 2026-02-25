import pytest
from src.app.crud.user import get_user_by_email

def _make_admin(client, db, email="admin_um@example.com", password="password"):
    client.post("/api/auth/register", json={"email": email, "password": password})
    user = get_user_by_email(db, email)
    user.role = "admin"
    db.commit()
    login_res = client.post("/api/auth/login", data={"username": email, "password": password})
    return login_res.json()["access_token"]

def test_list_users_for_admin(client, db):
    token = _make_admin(client, db)
    # Register another user
    client.post("/api/auth/register", json={"email": "user@example.com", "password": "password"})
    
    response = client.get("/api/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    users = response.json()
    assert len(users) >= 2
    # Check if stats are present
    assert "total" in users[0]
    assert "accepted" in users[0]
    assert "success_rate" in users[0]

def test_update_user_role(client, db):
    token = _make_admin(client, db, "super@example.com")
    
    # Register a submitter
    sub_email = "sub_to_promote@example.com"
    client.post("/api/auth/register", json={"email": sub_email, "password": "password"})
    sub_user = get_user_by_email(db, sub_email)
    sub_id = sub_user.id
    assert sub_user.role == "submitter"
    
    # Promote to admin
    response = client.patch(
        f"/api/admin/users/{sub_id}/role",
        json={"role": "admin"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["role"] == "admin"
    
    db.refresh(sub_user)
    assert sub_user.role == "admin"

def test_self_role_demotion_prevention(client, db):
    token = _make_admin(client, db, "self_demote@example.com")
    user = get_user_by_email(db, "self_demote@example.com")
    user_id = user.id
    
    response = client.patch(
        f"/api/admin/users/{user_id}/role",
        json={"role": "submitter"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 400
    assert "cannot change your own role" in response.json()["detail"]
