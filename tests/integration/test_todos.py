import pytest

def get_auth_headers(client, email, password="password"):
    client.post("/api/auth/register", json={"email": email, "password": password})
    login_res = client.post("/api/auth/login", data={"username": email, "password": password})
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_create_todo(client):
    headers = get_auth_headers(client, "todo@example.com")
    response = client.post(
        "/api/todos",
        json={"title": "Write integration tests"},
        headers=headers
    )
    assert response.status_code == 201
    assert response.json()["title"] == "Write integration tests"
    assert response.json()["done"] is False

def test_get_todos(client):
    headers = get_auth_headers(client, "list@example.com")
    client.post("/api/todos", json={"title": "Task 1"}, headers=headers)
    client.post("/api/todos", json={"title": "Task 2"}, headers=headers)
    
    response = client.get("/api/todos", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 2

def test_update_todo(client):
    headers = get_auth_headers(client, "update@example.com")
    res = client.post("/api/todos", json={"title": "Initial task"}, headers=headers)
    todo_id = res.json()["id"]
    
    response = client.patch(
        f"/api/todos/{todo_id}",
        json={"done": True, "title": "Updated task"},
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["done"] is True
    assert response.json()["title"] == "Updated task"

def test_delete_todo(client):
    headers = get_auth_headers(client, "delete@example.com")
    res = client.post("/api/todos", json={"title": "To be deleted"}, headers=headers)
    todo_id = res.json()["id"]
    
    response = client.delete(f"/api/todos/{todo_id}", headers=headers)
    assert response.status_code == 204
    
    # Verify it's gone
    get_res = client.get("/api/todos", headers=headers)
    assert len(get_res.json()) == 0

def test_todo_wrong_user(client):
    user1_headers = get_auth_headers(client, "user1@example.com")
    user2_headers = get_auth_headers(client, "user2@example.com")
    
    res = client.post("/api/todos", json={"title": "User 1 Task"}, headers=user1_headers)
    todo_id = res.json()["id"]
    
    # Try to delete user1's task with user2's headers
    response = client.delete(f"/api/todos/{todo_id}", headers=user2_headers)
    assert response.status_code == 404
