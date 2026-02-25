import pytest
import io
import os
from fastapi.testclient import TestClient
from src.app.main import app

def test_create_idea_authenticated(client):
    # Register and login
    email = "idea_user@example.com"
    client.post("/api/auth/register", json={"email": email, "password": "password"})
    login_res = client.post("/api/auth/login", data={"username": email, "password": "password"})
    token = login_res.json()["access_token"]
    
    # Create idea with file
    file_content = b"fake file content"
    file = io.BytesIO(file_content)
    
    response = client.post(
        "/api/ideas",
        data={
            "title": "New AI Project",
            "description": "A very innovative project using LLMs.",
            "category": "AI"
        },
        files={"attachment": ("test.txt", file, "text/plain")},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "New AI Project"
    assert data["file_path"] is not None
    assert os.path.exists(data["file_path"])

def test_create_idea_validation_error(client):
    email = "val_user@example.com"
    client.post("/api/auth/register", json={"email": email, "password": "password"})
    login_res = client.post("/api/auth/login", data={"username": email, "password": "password"})
    token = login_res.json()["access_token"]
    
    # Title too short (min_length=3)
    response = client.post(
        "/api/ideas",
        data={
            "title": "Ni",
            "description": "Valid description for the project.",
            "category": "AI"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 422

def test_list_ideas_isolation(client):
    # User A
    client.post("/api/auth/register", json={"email": "a@example.com", "password": "password"})
    token_a = client.post("/api/auth/login", data={"username": "a@example.com", "password": "password"}).json()["access_token"]
    client.post("/api/ideas", data={"title": "Idea A Title", "description": "Description for Idea A", "category": "AI"}, headers={"Authorization": f"Bearer {token_a}"})
    
    # User B
    client.post("/api/auth/register", json={"email": "b@example.com", "password": "password"})
    token_b = client.post("/api/auth/login", data={"username": "b@example.com", "password": "password"}).json()["access_token"]
    client.post("/api/ideas", data={"title": "Idea B Title", "description": "Description for Idea B", "category": "AI"}, headers={"Authorization": f"Bearer {token_b}"})
    
    # Check User A ideas
    res_a = client.get("/api/ideas", headers={"Authorization": f"Bearer {token_a}"})
    assert len(res_a.json()) == 1
    assert res_a.json()[0]["title"] == "Idea A Title"

def test_view_idea_detail(client):
    email = "detail@example.com"
    client.post("/api/auth/register", json={"email": email, "password": "password"})
    token = client.post("/api/auth/login", data={"username": email, "password": "password"}).json()["access_token"]
    
    create_res = client.post(
        "/api/ideas", 
        data={"title": "Detail Idea", "description": "Extensive description for detail view test.", "category": "Cloud"}, 
        headers={"Authorization": f"Bearer {token}"}
    )
    idea_id = create_res.json()["id"]
    
    response = client.get(f"/api/ideas/{idea_id}", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["title"] == "Detail Idea"
