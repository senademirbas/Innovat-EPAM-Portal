# TASKS-SOCIAL-001: Social SaaS Platform — Phase 2 & 3 Tasks

## Phase 1: Database Migration
- [ ] T001 Write `scripts/migrate_v2.py` — SQLite ALTER TABLE for all new columns
- [ ] T002 Add `avatar_url`, `bio`, `github_link`, `linkedin_link` to `User` model
- [ ] T003 Add `tags`, `problem_statement`, `solution`, `reviewed_by_id` to `Idea` model
- [ ] T004 Run migration script, verify `sql_app.db` schema updated
- [ ] T005 Update `test_all.db` (drop + recreate via pytest setup)

## Phase 2: Backend Schemas
- [ ] T006 Add `UserProfile` (writable) and `PublicProfile` (readable) to `schemas/user.py`
- [ ] T007 Extend `User` schema to include social fields
- [ ] T008 Add `tags`, `problem_statement`, `solution` to `IdeaCreate` in `schemas/idea.py`
- [ ] T009 Create `IdeaPublic` with nested `author: PublicProfile` and optional `reviewer: PublicProfile`

## Phase 3: Backend CRUD
- [ ] T010 Add `update_profile(db, user, data)` to `crud/user.py`
- [ ] T011 Add `get_public_profile(db, user_id)` to `crud/user.py`
- [ ] T012 Update `create_idea` in `crud/idea.py` to accept + store tags/problem/solution
- [ ] T013 Update `get_user_ideas` and `get_all_ideas` to eager-load owner + reviewer profiles
- [ ] T014 Update `evaluate_idea` in `crud/idea.py` to accept + store `reviewed_by_id`

## Phase 4: Backend API Endpoints
- [ ] T015 [TEST] Write tests for `PUT /users/me/profile`
- [ ] T016 Add `PUT /users/me/profile` to `api/users.py`
- [ ] T017 [TEST] Write tests for `GET /users/{user_id}/profile`
- [ ] T018 Add `GET /users/{user_id}/profile` to `api/users.py`
- [ ] T019 [TEST] Write tests for extended idea create/list with new fields
- [ ] T020 Update `api/ideas.py` to pass new fields through
- [ ] T021 [TEST] Write tests for reviewer identity in evaluation response
- [ ] T022 Update `api/admin.py` evaluate endpoint to accept + pass `reviewed_by_id`

## Phase 5: Frontend — index.html Structure
- [ ] T023 Add Chart.js already done (v2) ✓
- [ ] T024 Replace submitter table with `#idea-feed` card container div
- [ ] T025 Replace admin table with `#admin-feed` card container div
- [ ] T026 Update multi-step submit form (3 steps: tags, problem, solution+file)
- [ ] T027 Extend profile section with social field inputs + avatar preview
- [ ] T028 Update detail modal to full timeline layout

## Phase 6: Frontend — app.js
- [ ] T029 Implement `renderIdeaCard(idea)` → animated card HTML builder
- [ ] T030 Implement `renderFeed(ideas, containerId)` → replaces table rendering
- [ ] T031 Implement multi-step form state machine (step 1/2/3 transitions)
- [ ] T032 Update `openDetail(idea)` with timeline rendering logic
- [ ] T033 Implement `saveProfile(data)` → `PUT /users/me/profile`
- [ ] T034 Update profile page avatar preview (live URL preview on input)

## Phase 7: Frontend — style.css
- [ ] T035 Add `.idea-card` styles with hover lift (`hover:scale-[1.02]`)
- [ ] T036 Add `.timeline-node` and `.timeline-line` styles
- [ ] T037 Add `.tag-pill` style (colored tag chips)
- [ ] T038 Add `.step-form` slide animation styles

## Phase 8: Quality
- [ ] T039 Run full test suite — must be ≥ 32 tests passing
- [ ] T040 Final walkthrough update with screenshots
