# SPEC-PROF-001: Advanced Profile & Analytics Feature

## 1. Overview
Add a self-service **User Profile** page and an **Analytics Dashboard** to the InnovatEPAM Portal.
Submitters get personal stats and a password change form. Admins get system-wide charts and KPI cards.

---

## 2. Backend API Endpoints

### 2.1 `GET /api/users/me/stats` (Submitter-facing)
Returns aggregated stats for the currently authenticated user.

**Response schema:**
```json
{
  "total": 5,
  "accepted": 2,
  "rejected": 1,
  "pending": 2,
  "success_rate": 40.0
}
```
- `success_rate` = `(accepted / total) * 100`, rounded to 1 decimal. Returns `0.0` if `total == 0`.

### 2.2 `PUT /api/users/me/password` (Submitter + Admin)
Allows a logged-in user to securely change their password.

**Request body:**
```json
{ "current_password": "...", "new_password": "..." }
```

**Rules:**
- Validate `current_password` matches stored hash before updating.
- `new_password` must be ≥ 8 characters.
- Returns `HTTP 400` if `current_password` is wrong.
- Returns `HTTP 400` if `new_password` is same as `current_password`.

**Response:** `{ "message": "Password updated successfully" }`

### 2.3 `GET /api/admin/stats` (Admin-only)
System-wide analytics.

**Response schema:**
```json
{
  "total": 42,
  "accepted": 18,
  "rejected": 10,
  "pending": 14,
  "acceptance_rate": 42.9,
  "daily_submissions": [
    { "date": "2026-02-20", "count": 3 },
    { "date": "2026-02-21", "count": 7 }
  ]
}
```
- `daily_submissions`: Last 30 days, grouped by `DATE(created_at)`. Days with 0 submissions are **excluded** (sparse).

---

## 3. Backend Implementation Details

### 3.1 New Pydantic Schemas (`src/app/schemas/`)
- **`user.py`**: Add `PasswordChange` schema.
- **`stats.py`**: Add `UserStats` and `AdminStats` schemas (new file).

### 3.2 New CRUD functions (`src/app/crud/idea.py`)
- `get_user_stats(db, user_id)` — query counts by status filtered by user.
- `get_admin_stats(db)` — query system-wide counts + daily grouping using SQLite's `strftime('%Y-%m-%d', created_at)`.

### 3.3 New CRUD functions (`src/app/crud/user.py`)
- `change_password(db, user, new_hashed_password)` — update user record.

### 3.4 New API Router (`src/app/api/users.py`)
- `GET /users/me/stats` → calls `crud.idea.get_user_stats`.
- `PUT /users/me/password` → validates, calls `crud.user.change_password`.

### 3.5 Extend Admin Router (`src/app/api/admin.py`)
- Add `GET /admin/stats` → calls `crud.idea.get_admin_stats`.

### 3.6 Register Router (`src/app/main.py`)
- `app.include_router(users.router, prefix="/api")`

---

## 4. Frontend UI

### 4.1 Profile View (Submitter & Admin)
- New `#profile-view` section accessible via "Profile" nav link (visible when logged in).
- **Stats cards row**: Total, Accepted, Rejected, Pending, Success Rate (%).
- **Change Password form**: current_password + new_password + confirm_new_password fields (client-side match check).

### 4.2 Admin Analytics Section
- **Above** the existing admin ideas table.
- **KPI Cards**: Total, Accepted, Rejected, Pending, Acceptance Rate.
- **Chart.js** bar chart (via CDN): "Submissions per Day" (last 30 days).
  - X-axis: date labels. Y-axis: count. EPAM cyan color.

### 4.3 Navigation
- Add a `Profile` tab link in the navbar (icon + text). Clicking switches to `profile-view`.
- Submitter navbar: `My Ideas | Profile`.
- Admin navbar: `Dashboard | Analytics | Profile`.
- Maintain active tab state with a bottom-border highlight.

---

## 5. Test Coverage
- Integration tests for all 3 new endpoints (happy path + auth guard + validation errors).
- Estimated: +6 test cases in `tests/integration/test_users.py` and `test_admin.py`.
