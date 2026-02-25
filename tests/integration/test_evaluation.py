import pytest
from src.app.crud.user import get_user_by_email

def test_admin_evaluate_idea_success(client, db):
    # 1. Setup: Register Admin and Submitter
    admin_email = "admin_eval@example.com"
    sub_email = "sub_eval@example.com"
    
    client.post("/api/auth/register", json={"email": admin_email, "password": "password"})
    client.post("/api/auth/register", json={"email": sub_email, "password": "password"})
    
    # 2. Promote Admin
    admin_user = get_user_by_email(db, admin_email)
    admin_user.role = "admin"
    db.commit()
    
    # 3. Submitter creates an idea
    sub_login = client.post("/api/auth/login", data={"username": sub_email, "password": "password"})
    sub_token = sub_login.json()["access_token"]
    
    idea_res = client.post(
        "/api/ideas",
        data={"title": "Eval Idea", "description": "Idea to be evaluated by admin.", "category": "AI"},
        headers={"Authorization": f"Bearer {sub_token}"}
    )
    idea_id = idea_res.json()["id"]
    
    # 4. Admin evaluates idea
    admin_login = client.post("/api/auth/login", data={"username": admin_email, "password": "password"})
    admin_token = admin_login.json()["access_token"]
    
    eval_res = client.patch(
        f"/api/admin/ideas/{idea_id}/evaluate",
        json={"status": "accepted", "admin_comment": "Great idea, well detailed."},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert eval_res.status_code == 200
    assert eval_res.json()["status"] == "accepted"
    assert eval_res.json()["admin_comment"] == "Great idea, well detailed."
    
    # 5. Verify Submitter sees the evaluation
    view_res = client.get(f"/api/ideas/{idea_id}", headers={"Authorization": f"Bearer {sub_token}"})
    assert view_res.status_code == 200
    assert view_res.json()["status"] == "accepted"
    assert view_res.json()["admin_comment"] == "Great idea, well detailed."

def test_submitter_evaluate_idea_forbidden(client):
    sub_email = "attacker@example.com"
    client.post("/api/auth/register", json={"email": sub_email, "password": "password"})
    login_res = client.post("/api/auth/login", data={"username": sub_email, "password": "password"})
    token = login_res.json()["access_token"]
    
    # Try to evaluate an idea (doesn't matter which one, endpoint should be blocked by RoleChecker)
    response = client.patch(
        "/api/admin/ideas/some-id/evaluate",
        json={"status": "accepted", "admin_comment": "Hack attempt"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403
