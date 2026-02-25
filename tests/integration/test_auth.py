import pytest
from src.app.crud.user import get_user_by_email

def test_register_user(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "securepassword"}
    )
    assert response.status_code == 201
    assert response.json()["email"] == "test@example.com"

def test_register_duplicate_user(client):
    # Register once
    client.post(
        "/api/auth/register",
        json={"email": "duplicate@example.com", "password": "password"}
    )
    # Register again
    response = client.post(
        "/api/auth/register",
        json={"email": "duplicate@example.com", "password": "password"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

def test_login_user(client):
    client.post(
        "/api/auth/register",
        json={"email": "login@example.com", "password": "securepassword"}
    )
    response = client.post(
        "/api/auth/login",
        data={"username": "login@example.com", "password": "securepassword"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_invalid_credentials(client):
    client.post(
        "/api/auth/register",
        json={"email": "wrong@example.com", "password": "password"}
    )
    response = client.post(
        "/api/auth/login",
        data={"username": "wrong@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401

def test_get_current_user(client):
    client.post(
        "/api/auth/register",
        json={"email": "me@example.com", "password": "password"}
    )
    login_res = client.post(
        "/api/auth/login",
        data={"username": "me@example.com", "password": "password"}
    )
    token = login_res.json()["access_token"]
    
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"
