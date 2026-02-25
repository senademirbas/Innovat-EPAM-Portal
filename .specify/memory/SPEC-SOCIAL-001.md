# SPEC-SOCIAL-001: Social SaaS Platform Transformation — Phase 2 & 3

## 1. Overview

Transform InnovatEPAM from a simple form-based portal into a **Social SaaS Platform** where ideas are social objects with rich author identities, timeline history, tags, and an animated card feed UI.

---

## 2. Database Model Changes

### 2.1 User Model (`models/user.py`)
Add nullable columns — no existing data is broken.

| New Column | Type | Default | Notes |
|---|---|---|---|
| `avatar_url` | `String` | `null` | Profile photo URL or null |
| `bio` | `Text` | `null` | Short user bio |
| `github_link` | `String` | `null` | Full GitHub profile URL |
| `linkedin_link` | `String` | `null` | Full LinkedIn profile URL |

> `display_name` = derived from `email` prefix in code (no extra column needed).

### 2.2 Idea Model (`models/idea.py`)
Add nullable columns — no migration needed for SQLite (SQLAlchemy `create_all` with `checkfirst` handles existing tables by NOT adding columns automatically — a SQLite migration strategy is needed).

| New Column | Type | Default | Notes |
|---|---|---|---|
| `tags` | `String` | `null` | JSON-encoded list, e.g. `'["AI","LLM"]'` |
| `problem_statement` | `Text` | `null` | Dedicated problem description field |
| `solution` | `Text` | `null` | Dedicated solution description field |

> **Migration Strategy**: Since SQLite's `CREATE TABLE` doesn't auto-add new columns, we will drop and recreate the DB on dev (delete `sql_app.db`) and add the columns with `ALTER TABLE` in a migration script (`scripts/migrate_v2.py`).

### 2.3 Activity Tracking (No new model needed)
The existing `admin_comment` field on `Idea` is a single string. For Phase 2 we **enrich the API response** — when returning an idea's admin comment, we join the `owner` relationship on `Idea` and resolve the Admin user's identity from the evaluator's token at evaluation time.

API will return `author_name` (email prefix) and `author_avatar` as part of the evaluation payload and idea response.

---

## 3. Backend API Changes

### 3.1 `PUT /api/users/me/profile` (NEW)
Update the logged-in user's social profile fields.

**Request body:**
```json
{
  "avatar_url": "https://...",
  "bio": "Senior Engineer @ EPAM",
  "github_link": "https://github.com/user",
  "linkedin_link": "https://linkedin.com/in/user"
}
```
**Response:** Updated `User` object (extended schema).

### 3.2 `GET /api/users/{user_id}/profile` (NEW)
Public profile lookup — returns user identity for idea card display.

**Response:** `PublicProfile` (id, email, avatar_url, bio, github_link, linkedin_link).

### 3.3 `POST /api/ideas` — Extended
Accept new fields: `tags` (comma string → store as JSON), `problem_statement`, `solution`.

### 3.4 `GET /api/ideas` and `GET /api/admin/ideas` — Extended
Response must now include **author identity** (`author_email`, `author_avatar`, `author_github`, `author_linkedin`) resolved from the owner relationship.

### 3.5 `PATCH /api/admin/ideas/{id}/evaluate` — Extended
Record `reviewed_by_id` (store admin's user_id in the idea record), returned in the response as `reviewed_by_name` and `reviewed_by_avatar`.

**New column on `Idea`**: `reviewed_by_id = Column(String, ForeignKey("users.id"), nullable=True)`

---

## 4. Pydantic Schema Changes

### `schemas/user.py`
- `UserProfile` — writable fields: avatar_url, bio, github_link, linkedin_link.
- `PublicProfile` — read-only: id, email, avatar_url, bio, github_link, linkedin_link.
- Extend `User` response schema to include social fields.

### `schemas/idea.py`
- `IdeaCreate` — add optional `tags: str | None`, `problem_statement: str | None`, `solution: str | None`.
- `IdeaPublic` — extends `Idea` with nested `author: PublicProfile` and optional `reviewer: PublicProfile | None`.

---

## 5. Frontend Architecture

### 5.1 Animated Idea Feed (replaces all tables)
- Ideas rendered as **animated cards** using `transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`.
- Each card shows: avatar, name, tags (colored pills), title, brief problem preview, status badge, date.
- Click → smooth modal slide-in with full idea detail and timeline.

### 5.2 Timeline / Discussion View
- Inside the detail modal: a vertical timeline showing the submission event and evaluation event (if any).
- Each timeline node: avatar + name + timestamp + content.
- Admin evaluation shows admin's avatar + name + decision badge + comment.

### 5.3 Smart Multi-Step Submission Form
- **Step 1**: Title + Category + Tags (click-add tag pills).
- **Step 2**: Problem Statement (textarea with char counter).
- **Step 3**: Solution + Attachment.
- Progress bar at top, animated step transitions (`translate-x`).

### 5.4 Social Profile Page Update
- Existing profile page gains editable fields: avatar URL input with live preview, bio textarea, GitHub, LinkedIn.
- Save via `PUT /api/users/me/profile`.
- Anywhere an author is shown: rounded avatar (`object-cover rounded-full`) + clickable GitHub/LinkedIn icon buttons.

---

## 6. Migration Strategy

> [!WARNING]
> The existing `sql_app.db` and `test_all.db` will need to be migrated or recreated. SQLite does not support `ALTER TABLE ADD COLUMN` with foreign keys. We will use a migration script that:
> 1. Adds new nullable columns to `users` and `ideas` tables using `ALTER TABLE ... ADD COLUMN`.
> 2. Adds the `reviewed_by_id` column to `ideas`.
> This is non-destructive — existing rows get `NULL` for new columns.

---

## 7. Test Coverage Plan
- `test_profile_update.py`: `PUT /users/me/profile`, public profile lookup.
- `test_ideas_extended.py`: Submit with tags + problem + solution; verify in response.
- `test_evaluation_identity.py`: Evaluate an idea as admin; verify reviewer identity in response.
- All existing 22 tests must continue to pass.
