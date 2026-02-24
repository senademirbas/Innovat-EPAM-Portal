# 🚀 InnovatEPAM Portal

![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white)
![Pytest](https://img.shields.io/badge/pytest-%23C90000.svg?style=for-the-badge&logo=pytest&logoColor=white)

InnovatEPAM Portal is an AI-native web application designed to manage project ideas within an innovation framework. Built during the **A!tech Bootcamp**, it demonstrates a full Spec-Driven Development (SDD) lifecycle.

---

## 🛠 Features

### 🔐 User Authentication & RBAC
- **Secure Registration**: User signup with password hashing (bcrypt).
- **JWT Authentication**: Token-based login and session management.
- **Role-Based Access Control**: Strict separation between `submitter` and `admin` roles.

### 💡 Idea Submission Engine
- **Multipart Data Support**: Submit ideas with titles, detailed descriptions, and categories.
- **Secure File Uploads**: Support for single file attachments per idea, stored securely with UUID-based naming.
- **Dashboard**: Personal view for submitters to track their own contributions.

### ⚖️ Evaluation Workflow
- **Status Pipeline**: Tracking ideas through `submitted`, `under_review`, `accepted`, and `rejected`.
- **Admin Feedback**: High-level review system where admins can leave evaluation comments and update statuses.
- **Transparency**: Submitters can view real-time feedback and status updates on their submissions.

---

## 🏗 The Development Journey (Implementation Steps)

This project was built following a rigorous **AI-Native Sprint Workflow**. Below is the step-by-step roadmap of how the portal was constructed:

### Phase 1: Foundation & SDD Initialization
1.  **Project Scaffolding**: Initialized the project with `uv`, setting up the `src/app` and `tests/` structure.
2.  **SDD Configuration**: Initialized SpecKit and defined the **Project Constitution**, establishing TDD and 80%+ coverage as mandatory quality gates.
3.  **Git Identity**: Configured repository identity for `senademirbas`.

### Phase 2: Core Infrastructure (Auth)
4.  **Database Layer**: Setup SQLAlchemy Base and session management.
5.  **Security Utilities**: Implemented password hashing and JWT encoding/decoding logic.
6.  **User Model**: Created the foundational User model with role support.
7.  **Auth Integration**: Built the `/auth/register` and `/auth/login` endpoints using a TDD approach (Integration tests first).

### Phase 3: Idea Submission System
8.  **Idea Data Model**: Designed the `Idea` model with a foreign key relationship to `User`.
9.  **File System Setup**: Implemented secure local storage logic in the `uploads/` directory.
10. **Multipart API**: Built the `POST /ideas` endpoint to handle complex form data and file streams.
11. **Owner-Only Listing**: Implemented logic to ensure users can only list and view their own submissions.

### Phase 4: Evaluation Workflow & RBAC Polish
12. **Status Tracking**: Expanded the database schema and Pydantic models to include `status` and `admin_comment`.
13. **Evaluation Endpoint**: Created the `PATCH /admin/ideas/{id}/evaluate` endpoint, restricted strictly to admins via custom FastAPI dependencies.
14. **Integration Testing**: Verified the full review loop (Submitter uploads -> Admin evaluates -> Submitter views feedback).

### Phase 5: Quality Gates & Documentation
15. **Verification Suite**: Finalized 13 integration tests achieving **94% total code coverage**.
16. **ADR Documentation**: Documented key architectural decisions (ADR-001).
17. **Project Summary**: Generated the final lab completion report and professional documentation.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.12+
- [uv](https://github.com/astral-sh/uv)

### Installation & Run
```bash
# 1. Clone
git clone https://github.com/senademirbas/Innovat-EPAM-Portal.git
cd Innovat-EPAM-Portal

# 2. Setup
uv sync

# 3. Dev Run
uv run fastapi dev src/app/main.py
```

### API Docs
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

<img width="1375" height="827" alt="image" src="https://github.com/user-attachments/assets/a0cea522-05ff-4397-b602-567c65072a66" />

---

## 🧪 Testing
```bash
# Run tests with coverage
uv run pytest --cov=src --cov-report=term-missing
```

---
**Course**: A!tech Bootcamp
**Developer**: senademirbas
