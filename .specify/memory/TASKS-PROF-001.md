# TASKS-PROF-001: Advanced Profile & Analytics Tasks

## Phase 1: Backend – New Schemas
- [ ] T001 Add `PasswordChange` to `src/app/schemas/user.py`
- [ ] T002 Create `src/app/schemas/stats.py` with `UserStats` and `AdminStats` schemas

## Phase 2: Backend – CRUD
- [ ] T003 Add `get_user_stats(db, user_id)` to `src/app/crud/idea.py`
- [ ] T004 Add `get_admin_stats(db)` to `src/app/crud/idea.py` (daily grouping with SQLite strftime)
- [ ] T005 Add `change_password(db, user, new_hashed)` to `src/app/crud/user.py`

## Phase 3: Backend – API Endpoints (TDD)
- [ ] T006 [TEST] Write integration tests for `GET /api/users/me/stats`
- [ ] T007 Create `src/app/api/users.py` with `GET /users/me/stats` endpoint
- [ ] T008 [TEST] Write integration tests for `PUT /api/users/me/password`
- [ ] T009 Add `PUT /users/me/password` to `src/app/api/users.py`
- [ ] T010 [TEST] Write integration tests for `GET /api/admin/stats`
- [ ] T011 Add `GET /admin/stats` to `src/app/api/admin.py`
- [ ] T012 Register `users.router` in `src/app/main.py`

## Phase 4: Frontend – Profile View
- [ ] T013 Add `#profile-view` section to `static/index.html`
- [ ] T014 Add Profile nav link (with icon) visible when logged in
- [ ] T015 Implement `loadUserStats()` in `static/app.js`
- [ ] T016 Implement `renderProfileView()` with stats cards and password form
- [ ] T017 Implement `handlePasswordChange()` with client-side confirm validation

## Phase 5: Frontend – Admin Analytics
- [ ] T018 Add Chart.js CDN to `static/index.html`
- [ ] T019 Add `#admin-analytics` section above ideas table in Admin Dashboard
- [ ] T020 Implement `loadAdminStats()` in `static/app.js`
- [ ] T021 Implement `renderAdminCharts()` with KPI cards + bar chart

## Phase 6: Quality
- [ ] T022 Ensure all existing tests still pass (no regressions)
- [ ] T023 Final walkthrough update
