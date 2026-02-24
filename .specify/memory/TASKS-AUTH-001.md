# Tasks: User Authentication System

**Input**: Design documents from `.specify/memory/`
**Prerequisites**: [PLAN-AUTH-001.md](file:///d:/Akademik/EPAM/EPAM_Course_Project/Innovat-EPAM-Portal/.specify/memory/PLAN-AUTH-001.md) (required), [SPEC-AUTH-001.md](file:///d:/Akademik/EPAM/EPAM_Course_Project/Innovat-EPAM-Portal/.specify/memory/SPEC-AUTH-001.md) (required)

**Tests**: Tests are MANDATORY as per Constitution (TDD Red-Green-Refactor).

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure (src/app, tests/)
- [ ] T002 Initialize Python project and install dependencies (FastAPI, SQLAlchemy, pytest, etc.)
- [ ] T003 [P] Configure ruff/flake8 for PEP 8 compliance

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure for authentication

- [ ] T004 Setup SQLAlchemy Base and Database session (src/app/db/session.py)
- [ ] T005 [P] Implement password hashing utilities using passlib (src/app/core/security.py)
- [ ] T006 [P] Implement JWT token creation/validation (src/app/core/security.py)
- [ ] T007 Create User model with id, email, hashed_password, and role (src/app/models/user.py)
- [ ] T008 Setup FastAPI app and basic routing (src/app/main.py)

---

## Phase 3: User Story 1 - User Registration (Priority: P1) 🎯 MVP

**Goal**: Allow new users to register with email and password.

**Independent Test**: Register with valid data via `/auth/register` and check DB status.

### Tests for User Story 1
- [ ] T009 [P] [US1] Integration test: Register new user (tests/integration/test_auth.py)
- [ ] T010 [P] [US1] Integration test: Prevent duplicate registration (tests/integration/test_auth.py)

### Implementation for User Story 1
- [ ] T011 [P] [US1] Create UserCreate pydantic schema (src/app/schemas/user.py)
- [ ] T012 [US1] Implement user creation logic in CRUD (src/app/crud/user.py)
- [ ] T013 [US1] Implement `/auth/register` endpoint (src/app/api/auth.py)

---

## Phase 4: User Story 2 - User Login & Logout (Priority: P1)

**Goal**: Allow users to log in (get JWT) and log out.

**Independent Test**: Login with registered credentials to get token; verify token works on protected route.

### Tests for User Story 2
- [ ] T014 [P] [US2] Integration test: Login with valid/invalid credentials (tests/integration/test_auth.py)
- [ ] T015 [P] [US2] Integration test: Logout/Token invalidation (tests/integration/test_auth.py)

### Implementation for User Story 2
- [ ] T016 [P] [US2] Implement `get_user_by_email` in CRUD (src/app/crud/user.py)
- [ ] T017 [US2] Implement `/auth/login` endpoint (src/app/api/auth.py)
- [ ] T018 [US2] Implement authentication dependency `get_current_user` (src/app/api/deps.py)
- [ ] T019 [US2] Implement `/auth/logout` endpoint (src/app/api/auth.py)

---

## Phase 5: User Story 3 - Role-Based Access Control (Priority: P2)

**Goal**: Distinguish between submitter and admin access.

**Independent Test**: Access `/admin/summary` with admin token (Success) vs. submitter token (403).

### Tests for User Story 3
- [ ] T020 [P] [US3] Integration test: Admin access to dashboard (tests/integration/test_admin.py)
- [ ] T021 [P] [US3] Integration test: Submitter blocked from dashboard (tests/integration/test_admin.py)

### Implementation for User Story 3
- [ ] T022 [US3] Implement Role checker dependency (src/app/api/deps.py)
- [ ] T023 [US3] Create `/admin/summary` endpoint restricted to Admin (src/app/api/admin.py)

---

## Phase 6: Polish & Final Quality Gates

- [ ] T024 [P] Verify 80% test coverage across business logic
- [ ] T025 Run full TDD cycle check and final refactor
- [ ] T026 Final documentation update
