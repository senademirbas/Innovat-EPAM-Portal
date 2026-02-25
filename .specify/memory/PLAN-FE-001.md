# PLAN-FE-001: Implementing EPAM UI Polish

## 1. Proposed Changes

### 1.1. Brand Identity & Global Styles
- **[MODIFY] [style.css](file:///d:/Akademik/EPAM/EPAM_Course_Project/Innovat-EPAM-Portal/static/style.css)**:
    - Update CSS variables with EPAM corporate colors (Deep Navy, Neon Cyan).
    - Import 'Montserrat' from Google Fonts.
    - Refine global transitions for a premium feel.

### 1.2. Layout & Structure
- **[MODIFY] [index.html](file:///d:/Akademik/EPAM/EPAM_Course_Project/Innovat-EPAM-Portal/static/index.html)**:
    - Apply EPAM cyan accents to buttons and active states.
    - Implement a sleek sidebar or refined top-nav to match epam.com.
    - Ensure all components use Tailwind's `dark:` classes for robust mode switching.

### 1.3. State & Logic
- **[MODIFY] [app.js](file:///d:/Akademik/EPAM/EPAM_Course_Project/Innovat-EPAM-Portal/static/app.js)**:
    - Set 'dark' as the default theme if no preference is found.
    - Update rendering templates to use EPAM-branded status badges and action buttons.

## 2. Verification Plan

### 2.1. Visual Audit
- Verify color contrast ratios for accessibility.
- Ensure the "EPAM neon" accent is used consistently across both Submitter and Admin roles.
- Test the Theme Toggle persistence after page refresh.

### 2.2. Functional Testing
- Rerun integration tests to ensure that the structural changes in HTML didn't break any ID/Class selectors used for automation.
- Verify that Role-Based routing still works correctly (Admin vs Submitter).
