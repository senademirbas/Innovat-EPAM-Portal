# TASKS-IDEA-001: Idea Submission System Tasks

## Phase 1: Setup & Foundational (Prerequisites)
- [x] T001 Create `uploads/` directory and `.gitignore` it.
- [x] T002 Define `Idea` SQLAlchemy model and register in `Base`.
- [x] T003 Define Pydantic schemas for Idea submission and output.
- [x] T004 Implement basic CRUD for Ideas (Create, List, Get).

## Phase 2: Feature Implementation (TDD)
- [x] T005 [P1] Integration test: Successfully submit idea with file.
- [x] T006 [P1] Implement `POST /ideas` endpoint with multipart/form-data.
- [x] T007 [P1] Integration test: List only my ideas.
- [x] T008 [P1] Implement `GET /ideas` endpoint.
- [x] T009 [P2] Integration test: View specific idea details.
- [x] T010 [P2] Implement `GET /ideas/{id}` endpoint.

## Phase 3: Cleanup & Documentation
- [x] T011 Verify 80% coverage for Idea module.
- [x] T012 Final documentation (Walkthrough).
