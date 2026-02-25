# SPEC-FE-001: InnovatEPAM Portal — Frontend UI Specification (v3 — Premium SaaS)

## 1. Vision
A **dark-first, glassmorphic, enterprise-grade Social SaaS portal**. Every interaction is animated. Every surface glows. Tables are gone. The UI must feel as premium as Linear, Vercel Dashboard, or Notion AI.

---

## 2. Design System

### 2.1 Typography
- Font: **Inter** (Google Fonts, weights 300–800)
- Headings: `tracking-tight font-extrabold`
- Body: `font-medium` or `font-normal`
- Muted text: `text-slate-400` (dark) / `text-slate-500` (light)

### 2.2 Color Tokens (CSS Custom Properties)

| Token | Dark Mode | Light Mode |
|---|---|---|
| `--bg-base` | `linear-gradient(135deg, #0f172a, #0a192f, #0f172a)` | `#f8fafc` (slate-50) |
| `--bg-surface` | `rgba(30,41,59,0.7)` | `#ffffff` |
| `--bg-glass` | `rgba(15,23,42,0.5)` | `rgba(255,255,255,0.8)` |
| `--border-glass` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.07)` |
| `--accent` | `#06b6d4` (cyan-500) | `#0891b2` (cyan-600) |
| `--accent-glow` | `0 0 20px rgba(6,182,212,0.45)` | `0 0 12px rgba(8,145,178,0.3)` |
| `--text-primary` | `#f1f5f9` | `#0f172a` |
| `--text-muted` | `#94a3b8` | `#64748b` |

### 2.3 Glassmorphism Rule
All cards, modals, sidebar, and dropdowns must use:
```css
backdrop-filter: blur(16px);
background: var(--bg-glass);
border: 1px solid var(--border-glass);
```

### 2.4 Glow Rule
Primary buttons and active sidebar items:
```css
box-shadow: var(--accent-glow);
```

### 2.5 Animation Rule
All interactive elements: `transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`  
Cards on hover: `transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,0.4)`

---

## 3. Layout Architecture

### 3.1 Overall Shell
```
┌─────────────────────────────────────────────────┐
│  LEFT SIDEBAR (240px / collapsible to 64px)     │
│  ┌───────────────────────────────────────────┐  │
│  │ MAIN CONTENT (flex-1, scrollable)         │  │  
│  │   TOP BAR: Search · Bell · Avatar         │  │
│  │   PAGE CONTENT                            │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### 3.2 Left Sidebar
- **Width**: 240px expanded, 64px collapsed (icon-only mode)
- **Toggle**: Hamburger button in topbar collapses/expands it
- **Content** (top to bottom):
  - EPAM logo + "InnovatEPAM" wordmark (hidden when collapsed)
  - Nav items with icon + label: `Dashboard`, `My Ideas`, `Analytics` (admin only), `Profile`
  - Active state: accent left-border + glow background + glowing text
  - Bottom: user mini-profile card (avatar, name, role)
- **Styling**: Full-height, glassmorphic, `position: fixed left-0`, `z-index: 40`
- **Mobile**: Slides over content, overlay backdrop

### 3.3 Top Header Bar
- `position: sticky top-0 z-50`
- Left: sidebar toggle hamburger button
- Center: Global search bar (`⌘K` hint, expanding on focus with `backdrop-blur`)
- Right: Notification bell (icon + badge), user avatar button (opens dropdown)
- Glassmorphic background

---

## 4. Pages

### 4.1 Auth Page
- Full viewport, centered vertically
- Animated gradient background orbs (CSS radial gradients, slow keyframe animation)
- Glassmorphic auth card (`max-w-sm`)
- Form toggle: Login ↔ Register (animated height transition)
- Subtle EPAM badge at bottom

### 4.2 Submitter — Idea Feed

**Header Row:**
- Title: "Innovation Feed"
- "New Idea +" button (glow style, opens 3-step modal)  
- Filter chips: All | Accepted | Pending | Rejected

**Feed Layout:**
- CSS Grid masonry: `columns: 1 / 2 / 3` (responsive), or CSS `grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))`
- Cards: glassmorphic, staggered fade-in animation (nth-child delay)

**Idea Card Structure:**
```
┌──────────────────────────────────────────┐
│  [Avatar] Author name · timestamp        │ ← header row
│                                          │
│  Card Title (font-bold, 1.1rem)          │
│  Description snippet (2-line clamp)      │
│  Problem snippet (italic, muted)         │
│                                          │
│  [Tag Pills row]                         │
│  ─────────────────────────────────────── │
│  [Category badge]   [Status badge]  [→] │ ← footer
└──────────────────────────────────────────┘
```
- Hover: `translateY(-4px)` + cyan border glow + `shadow-2xl`
- Click: opens Timeline Detail Drawer (right-side slide-in panel)

### 4.3 Admin — Dashboard

**Top Row — 4 Metric Cards (Glassmorphic):**
| Card | Icon | Trend |
|---|---|---|
| Total Ideas | 💡 | e.g. `+8% ↑` green |
| Accepted | ✓ | `+12% ↑` green |
| Pending | ⏳ | `→` neutral |
| Success Rate | % | trend indicator |

Each card: glassmorphic, large number, small trend in `text-green-400` or `text-red-400`.

**Chart — Idea Submissions Over 30 Days:**
- Chart.js `line` type with `tension: 0.4` (spline curve)
- Gradient fill under the line (canvas `createLinearGradient`)
- Custom tooltips (dark background, cyan border)
- Cyan line color (`#06b6d4`), no legend

**Ideas Feed (Admin):**
- Same card grid as submitter feed, but each card has a "Review →" action button
- Clicking "Review →" opens the **Review Side-Panel** (drawer)

### 4.4 Review Side-Panel (Admin Drawer)
- Slides in from the right (`transform: translateX(100%)` → `translateX(0)`)
- Width: `min(600px, 100vw)`
- Backdrop overlay with `backdrop-blur-sm`
- **Content:**
  - Title, category badge, tags, author info + avatar
  - Full description in scrollable content area
  - Problem statement section (if present)
  - Solution section (if present)  
  - Attachment download link (if present)
  - **Sticky footer**: Comment textarea + `Accept` (green glow) + `Reject` (red) buttons
- Close: X button or click backdrop

### 4.5 Timeline Detail Drawer (Submitter)
- Same slide-in mechanic as Review Drawer (right side)
- **Content:** Timeline events (submission → evaluation)
- Timeline nodes: colored circles connected by lines
- Reviewer avatar + name shown after evaluation
- Glassmorphic background

### 4.6 Profile — Bento Grid
```
┌─────────────────────┬──────────────────────┐
│  Identity Card       │  Stats Card          │
│  [Avatar 5rem]       │  Total / Accepted /  │
│  Name: "Sena"        │  Rejected / Rate     │
│  Bio text (muted)    │                      │
│  GitHub / LinkedIn   │                      │
├─────────────────────┴──────────────────────┤
│  Recent Ideas (last 3 cards, mini)         │
├────────────────────────────────────────────┤
│  Edit Profile Form  │  Change Password     │
└─────────────────────┴──────────────────────┘
```
- Placeholder data: Name "Sena", Bio "Information Systems Engineer", GitHub "@senademirbas", Studio "Rainy Day"
- Avatar uses initials `S` in accent ring if no URL provided

---

## 5. Multi-Step Submit Modal (3-Step)
- **Glass modal** overlay (not a drawer)
- Gradient progress bar: 33% → 66% → 100%
- **Step 1**: Title + Category (dropdown) + Tag chip picker
- **Step 2**: Problem Statement (large textarea)
- **Step 3**: Description (required) + Solution + File upload
- Animated panel transitions (slide left/right)
- Submit button has glow effect

---

## 6. Component Library

| Component | Classname | Description |
|---|---|---|
| Glass Card | `.glass-card` | glassmorphic surface card |
| Idea Card | `.idea-card` | hover lift + glow border |
| Tag Pill | `.tag-pill .tag-{color}` | 5-color hash system |
| Status Badge | `.badge .badge-{status}` | accepted/rejected/submitted |
| Primary Button | `.btn-primary` | cyan with glow |
| Ghost Button | `.btn-ghost` | borderless, muted |
| Toast | `.toast` | bottom-right, 3.5s dismiss |
| Skeleton | `.skeleton` | shimmer loading placeholder |
| Drawer | `.drawer` | right-slide panel |
| Sidebar | `#sidebar` | collapsible left nav |

---

## 7. Skeleton Loaders
- Show while data is fetching (before API call resolves)
- Cards: animated shimmer blocks (`@keyframes shimmer`) matching card shape
- KPI cards: shimmer rectangle

---

## 8. Technical Constraints
- Vanilla HTML + CSS + JS (no framework)
- Tailwind CSS v3 via CDN `tailwind.config = { darkMode: 'class' }`
- Dark mode is **default** (applied on first load)
- Chart.js v4 via CDN
- Served via FastAPI static mount (`/` → `static/`)
- Theme stored in `localStorage`

---

## 9. Backward Compatibility
- All existing API integrations preserved (login, ideas, admin evaluate, profile, stats)
- 33 integration tests remain unaffected (backend unchanged)
