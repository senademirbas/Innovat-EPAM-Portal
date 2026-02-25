"""
test_ideas_extended.py — Integration tests for extended idea fields.
Verifies tags, problem_statement, solution pass through to the API response,
and that responses include the nested author public profile.
"""
import pytest

def _register_login(client, email, password="password"):
    client.post("/api/auth/register", json={"email": email, "password": password})
    res = client.post("/api/auth/login", data={"username": email, "password": password})
    return res.json()["access_token"]

def _auth(token):
    return {"Authorization": f"Bearer {token}"}

def _post_idea(client, token, **kwargs):
    defaults = {"title": "Tag Test Idea", "description": "Testing tag and rich fields.", "category": "AI"}
    defaults.update(kwargs)
    return client.post("/api/ideas", data=defaults, headers=_auth(token))


def test_create_idea_with_tags_and_rich_fields(client):
    token = _register_login(client, "tags_user@example.com")
    resp = _post_idea(
        client, token,
        title="AI Reviewer Tool",
        description="Reviewing code with AI agents for efficiency.",
        category="AI",
        tags="AI, LLM, DevTools",
        problem_statement="Code reviews are slow and inconsistent.",
        solution="Deploy an LLM agent that reviews PRs automatically.",
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["tags"] == "AI, LLM, DevTools"
    assert data["problem_statement"] == "Code reviews are slow and inconsistent."
    assert data["solution"] == "Deploy an LLM agent that reviews PRs automatically."


def test_idea_response_includes_author(client):
    """IdeaPublic must include a nested `author` with public profile fields."""
    token = _register_login(client, "author_check@example.com")
    # Set a bio so we can confirm it's in the nested author
    client.put("/api/users/me/profile", json={"bio": "Test Author"}, headers=_auth(token))
    resp = _post_idea(client, token, title="Author Check Idea", description="Checking author field in response.", category="Cloud")
    assert resp.status_code == 201
    data = resp.json()
    assert "author" in data
    assert data["author"] is not None
    assert data["author"]["email"] == "author_check@example.com"
    assert data["author"]["bio"] == "Test Author"


def test_list_ideas_includes_author(client):
    """GET /api/ideas response list items must all include nested author."""
    token = _register_login(client, "list_author@example.com")
    _post_idea(client, token, title="List Idea One", description="Author check on list.", category="AI")
    resp = client.get("/api/ideas", headers=_auth(token))
    assert resp.status_code == 200
    ideas = resp.json()
    assert len(ideas) >= 1
    for idea in ideas:
        assert "author" in idea
        assert idea["author"]["email"] == "list_author@example.com"


def test_idea_without_new_fields_has_null_values(client):
    """Submitting without tags/problem/solution → those fields are null."""
    token = _register_login(client, "no_tags_user@example.com")
    resp = _post_idea(client, token, title="Simple Idea", description="No extra fields needed.", category="Other")
    assert resp.status_code == 201
    data = resp.json()
    assert data["tags"] is None
    assert data["problem_statement"] is None
    assert data["solution"] is None
