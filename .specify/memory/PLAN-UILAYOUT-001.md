# PLAN-UILAYOUT-001: Layout & Password Toggle Fix (v2)

## Files to Change

### [MODIFY] `static/style.css`

**Change 1**: Update `#page-content` — remove padding, keep flex growth:
```css
#page-content {
    flex: 1;
    overflow-y: auto;
    padding: 0;
}
```

**Change 2**: Rewrite `.content-wrapper` to use tighter max-width with flex-column + items-start:
```css
.content-wrapper {
    max-width: 64rem;   /* ~1024px */
    margin: 0 auto;
    width: 100%;
    padding: 2rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
}
```

---

### [MODIFY] `static/index.html`

**Change 1 — Cache Bust**: Update the `<script>` tag at the bottom:
```html
<!-- Before -->
<script src="/static/app.js"></script>
<!-- After -->
<script src="/static/app.js?v=2"></script>
```

**Change 2 — Section headers**: The inline `style="display:flex;align-items:center;justify-content:space-between;..."` divs inside each section must have `width:100%` added so they stretch full width inside the flex column container.

---

### [VERIFY] `static/app.js`

Confirm `togglePw` function is at line 23. No code changes needed.

## What NOT to Change
- `#app-shell`, `#sidebar`, `#topbar` structure or CSS.
- Any drawer, modal, or JavaScript logic beyond the cache-bust.
