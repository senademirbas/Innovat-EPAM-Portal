# Implementation Plan: User Authentication System

**Branch**: `001-user-auth` | **Date**: 2026-02-24 | **Spec**: [SPEC-AUTH-001.md](file:///d:/Akademik/EPAM/EPAM_Course_Project/Innovat-EPAM-Portal/.specify/memory/SPEC-AUTH-001.md)

## Summary
Implement a secure authentication system using FastAPI. The approach includes:
- **FastAPI** as the web framework.
- **SQLAlchemy** for ORM with **SQLite** (Initial development) / **PostgreSQL** (Production).
- **OAuth2 with Password flow** and **JWT** for session management.
- **Bcrypt** for password hashing.
- Role-based checking via dependency injection.

## Technical Context

**Language/Version**: Python 3.12 
**Primary Dependencies**: FastAPI, SQLAlchemy, Pydantic, python-jose, passlib[bcrypt], python-multipart
**Storage**: SQLite (Dev) / PostgreSQL (Target)
**Testing**: pytest, httpx (for async client testing)
**Target Platform**: Linux/Docker
**Project Type**: web-service
**Performance Goals**: < 100ms response time for auth endpoints.
**Constraints**: 80% business logic coverage (from Constitution).

## Constitution Check

- **Clean Python Code**: Will use `ruff` or `flake8` to ensure PEP 8 compliance.
- **TDD Mandatory**: All endpoints will start with a failing test case.
- **Testing Pyramid**: 
    - Unit: Models, Password Hashing, JWT utils.
    - Integration: FastAPI endpoints with TestClient.
    - E2E: Full flow from register to login to role-auth access.
- **Quality Gates**: 80% coverage enforced via `pytest-cov`.

## Project Structure

```text
src/
├── app/
│   ├── main.py             # FastAPI App entry
│   ├── api/                # API Endpoints
│   │   ├── auth.py         # Registration, Login, Logout
│   │   └── deps.py         # Dependencies (get_current_user, get_db)
│   ├── core/               # Configuration and Security (JWT, Hashing)
│   │   ├── config.py
│   │   └── security.py
│   ├── models/             # SQLAlchemy Models
│   │   └── user.py
│   ├── schemas/            # Pydantic Schemas
│   │   └── user.py
│   └── crud/               # Database operations
│       └── user.py
├── db/                     # Migrations (Alembic)
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

**Structure Decision**: Standard FastAPI modular structure to support scalability and maintainability.

## API Endpoints

| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Create a new user account | None |
| POST | `/auth/login` | Authenticate and get JWT | None |
| POST | `/auth/logout` | Invalidate token (Blacklist if needed) | Any |
| GET | `/admin/summary` | Mock admin dashboard for testing | Admin |

## Data Model (SQLAlchemy)

```python
class User(Base):
    __tablename__ = "users"
    id = Column(UUID, primary_key=True, default=uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum("submitter", "admin"), default="submitter")
    is_active = Column(Boolean, default=True)
```
