# SPEC-FE-001: InnovatEPAM Portal - Frontend UI Specification (v2)

## 1. Overview
Full rewrite of the portal frontend to fix UX deficiencies: poor contrast, missing detail views, 
incomplete admin panel, and unclear navigation. The goal is a clean, professional, highly usable 
interface that works excellently in both light and dark modes.

## 2. Theme & Color System

### 2.1 Light Mode (Default)
- Background: `bg-gray-50`
- Text: `text-gray-900`
- Cards: `bg-white shadow-md`
- Secondary text: `text-gray-500`

### 2.2 Dark Mode
- Background: `bg-slate-900`
- Text: `text-gray-100`
- Cards: `bg-slate-800 border border-slate-700`
- Secondary text: `text-slate-400`

### 2.3 Accents
- Primary buttons: `bg-cyan-600 hover:bg-cyan-700 text-white`
- Links & active states: `text-cyan-400` (dark) / `text-cyan-600` (light)
- Status badges: Color-coded (green=accepted, yellow=pending, red=rejected)
- Fonts: 'Montserrat' or 'Inter', system fallback.

## 3. Pages & Views

### 3.1 Auth Page (Unauthenticated)
- Clean, centered card with login and register forms.
- Toggle between login and register.
- EPAM branding.

### 3.2 Submitter Dashboard
- Navbar: user email, role badge, logout button.
- "Submit New Idea" button opens a form **modal overlay**.
- "My Submissions" table/grid:
  - Columns: Title, Category, Date, Status.
  - Clicking a row opens an **Idea Detail Modal**.

### 3.3 Idea Detail Modal (NEW - Critical UX)
- Triggered by clicking any idea row/card.
- Displays:
  - Full title and description.
  - Category badge.
  - Status badge with color.
  - Attached file link (if present).
  - Admin's evaluation comment (if available).

### 3.4 Admin Dashboard (Separate, Role-Gated)
- Only visible to users with `role === 'admin'`.
- Navbar shows "Admin Dashboard" view.
- Data table listing ALL ideas from all users.
- Columns: Submitter (user_id), Title, Category, Status, Action.
- "Review" button per row opens **Admin Review Modal**.

### 3.5 Admin Review Modal (NEW - Critical Feature)
- Shows full idea details.
- Textarea for admin comment.
- "Accept" button (green): sets status to `accepted`.
- "Reject" button (red): sets status to `rejected`.

## 4. Technical Constraints
- Vanilla HTML + CSS + JS, Tailwind CSS via CDN.
- Served via FastAPI static mount.
- Dark mode via Tailwind `darkMode: 'class'`.
- Theme preference persisted in `localStorage`.
