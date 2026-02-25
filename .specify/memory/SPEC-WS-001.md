# SPEC-WS-001: Workspace & User Management Expansion (Phase 4)

## 1. Overview
Adds personal productivity tools (todos, calendar events), an admin user-management dashboard, interactive notification bell, and a critical layout scroll bug fix.

---

## 2. Critical Bug Fix

### 2.1 Scroll / Layout
The current layout uses `min-height: 100vh` which causes content beyond the viewport to be clipped by the sidebar on some browsers.

**Target state:**
- `body` → `height: 100vh; overflow: hidden; display: flex`
- `#sidebar` → `height: 100vh; overflow-y: auto`
- `#app-shell` → `flex: 1; height: 100vh; overflow: hidden; display: flex; flex-direction: column`
- `#topbar` → `flex-shrink: 0` (never scrolls)
- `#page-content` → `flex: 1; overflow-y: auto` (**only this panel scrolls**)

---

## 3. Notification Bell

Clicking the bell icon in the topbar opens a **glassmorphic dropdown** with:
- Header: "Recent Activity" + unread count badge (auto-clears on open)
- Up to 5 activity items (initially seeded from API or client-side defaults)
- Each item: icon, text, relative timestamp, colored dot
- Closes on outside click

**API note (future):** A `/api/notifications` endpoint can feed real data; for now use client-side seed data.

---

## 4. Backend API Additions

### 4.1 Todo List (`/api/todos`)
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET`    | `/api/todos`      | 🔒 Any | List current user's todos, ordered by created_at |
| `POST`   | `/api/todos`      | 🔒 Any | Create a todo (`{ "text": "..." }`) |
| `PATCH`  | `/api/todos/{id}` | 🔒 Owner | Update text or toggle `done` |
| `DELETE` | `/api/todos/{id}` | 🔒 Owner | Delete a todo |

**Todo model fields:** `id`, `user_id` (FK), `text`, `done` (bool), `created_at`

### 4.2 Calendar Events (`/api/events`)
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET`  | `/api/events` | 🔒 Any | List events for current user |
| `POST` | `/api/events` | 🔒 Any | Create event (`{ "title": "...", "date": "YYYY-MM-DD", "color": "#06b6d4" }`) |

**CalendarEvent model fields:** `id`, `user_id` (FK), `title`, `date` (string YYYY-MM-DD), `color`

### 4.3 Admin User Management
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET`   | `/api/admin/users`                | 🔒 Admin | All users + stats: `{ email, role, total, accepted, success_rate }` |
| `PATCH` | `/api/admin/users/{user_id}/role` | 🔒 Admin | Set role to `"admin"` or `"submitter"` |

### 4.4 Profile PATCH
| Method | Path | Auth | Description |
|---|---|---|---|
| `PATCH` | `/api/users/me` | 🔒 Any | Partial update: `bio`, `github_link`, `linkedin_link`, `studio_name` |

`studio_name` is a new nullable String column added to `users` table.

---

## 5. Frontend Views

### 5.1 My Workspace (all authenticated users)
New sidebar item "Workspace" (icon: ✓ checklist). View contains two panels:

**Todo Board:**
- Glass card with "My Tasks" header + "Add task" input (inline submit)
- Each item: checkbox (strike-through on done), text, delete icon
- Done items shown slightly muted, re-clickable to un-done

**Mini Calendar:**
- Month grid: 7 columns (S M T W T F S), day number cells
- **Dot indicators** on dates that have a CalendarEvent OR an idea submission
- "< Prev / Next >" navigation between months
- Click a day to open a small "Add event" inline form

### 5.2 User Management (admin only)
New sidebar item "Users" (icon: 👥 group). View contains:

**Glassmorphic User Table:**
- Columns: `Avatar | Email | Role | Total | Accepted | Rate | Sparkline | Action`
- Role column: pill badge (admin=purple, submitter=cyan)
- Sparkline: 60×24 mini `<canvas>` Chart.js bar per user (last 7 submissions)
- Action: "Toggle Role" button → PATCH + confirmation toast ("User promoted to Admin")

---

## 6. Test Coverage
- `tests/integration/test_todos.py` — 5 cases
- `tests/integration/test_events.py` — 2 cases
- `tests/integration/test_admin_users.py` — 3 cases
- Estimated total: **~50 tests**
