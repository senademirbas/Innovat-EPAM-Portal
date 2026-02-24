# TASKS-IDEA-001: Idea Submission System Tasks

## Phase 1: Setup & Foundational (Prerequisites)
- [ ] T001 Create `uploads/` directory and `.gitignore` it.
- [ ] T002 Define `Idea` SQLAlchemy model and register in `Base`.
- [ ] T003 Define Pydantic schemas for Idea submission and output.
- [ ] T004 Implement basic CRUD for Ideas (Create, List, Get).

## Phase 2: Feature Implementation (TDD)
- [ ] T005 [P1] Integration test: Successfully submit idea with file.
- [ ] T006 [P1] Implement `POST /ideas` endpoint with multipart/form-data.
- [ ] T007 [P1] Integration test: List only my ideas.
- [ ] T008 [P1] Implement `GET /ideas` endpoint.
- [ ] T009 [P2] Integration test: View specific idea details.
- [ ] T010 [P2] Implement `GET /ideas/{id}` endpoint.

## Phase 3: Cleanup & Documentation
- [ ] T011 Verify 80% coverage for Idea module.
- [ ] T012 Final documentation (Walkthrough).
