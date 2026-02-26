# SPEC-UILAYOUT-001: Main Content Layout & Password Toggle Fix

**Status**: Revised (v2)

---

## Bug 1 — Main Content Alignment

### Symptom
"Innovation Feed" content and all other view sections appear pushed toward the right edge, leaving blank space in the center-left area of the screen.

### Diagnosis
The current `#page-content` CSS rule has `flex: 1; overflow-y: auto; padding: 1.5rem 1.25rem`. The `.content-wrapper` inside each section provides `max-width: 1200px; margin: 0 auto`, but this does NOT constrain items within the section to start from the left. The max-width is too wide on typical screens and there are no `align-items:flex-start` constraints anywhere.

### Required Fix
1. **`#page-content` wrapper**: Replace the existing plain `<main id="page-content">` CSS to use `width: 100%; flex: 1; overflow-y: auto; padding: 0` — remove padding from the container itself.
2. **`.content-wrapper`**: Replace with a tighter centered wrapper: `max-width: 72rem (1152px)` → use `max-width: 64rem (1024px)`, add `padding: 2rem 1.5rem`, `margin: 0 auto`, `width: 100%`, `display: flex; flex-direction: column; align-items: flex-start`.
3. **No `ml-auto` / `justify-end`**: Confirm no stray classes in section headers push content right.

### Acceptance Criteria
- Content is horizontally centered in the main area.
- Content starts from the left side of the centered container, NOT floated right.
- Sidebar and topbar are unaffected.

---

## Bug 2 — Password Toggle Not Working

### Symptom
The eye icon button on password inputs does not toggle the field between `type="password"` and `type="text"`.

### Diagnosis
The `togglePw(inputId, btn)` function **exists in `app.js` at line 23**. The HTML in `index.html` correctly calls `onclick="togglePw('login-password', this)"`. The root cause is **browser caching** — the old version of `app.js` without `togglePw` is being served from cache.

### Required Fix
1. Add a **cache-busting query string** to the `app.js` `<script>` tag: `<script src="/static/app.js?v=2"></script>`
2. Verify the `togglePw` function is complete in `app.js` (it is — confirmed at line 23).

### Acceptance Criteria
- Clicking the eye button toggles password visibility.
- The SVG switches between open-eye and slashed-eye icon.
- Works on all 5 password fields (login, register, cp-current, cp-new, cp-confirm).
