import pytest

def get_auth_headers(client, email, password="password"):
    client.post("/api/auth/register", json={"email": email, "password": password})
    login_res = client.post("/api/auth/login", data={"username": email, "password": password})
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_create_event(client):
    headers = get_auth_headers(client, "event@example.com")
    response = client.post(
        "/api/events",
        json={"title": "Team Sync", "date": "2026-03-01", "color": "#ff0000"},
        headers=headers
    )
    assert response.status_code == 201
    assert response.json()["title"] == "Team Sync"
    assert response.json()["date"] == "2026-03-01"

def test_get_events(client):
    headers = get_auth_headers(client, "events@example.com")
    client.post("/api/events", json={"title": "E1", "date": "2026-03-01"}, headers=headers)
    client.post("/api/events", json={"title": "E2", "date": "2026-03-02"}, headers=headers)
    
    response = client.get("/api/events", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 2
