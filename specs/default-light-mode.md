# Chore: Default to Light Mode

## Chore Description
Change the application's default theme from dark mode to light mode. When no user preference is stored in localStorage, the app should render in light mode instead of dark mode.

## Agent Reports

### 🔍 Scope Analysis
- **What exactly is being asked?** Change the default theme from dark to light when no `rad-theme` value exists in localStorage.
- **What is NOT being asked?** Removing dark mode, changing toggle behavior, modifying CSS variables, or altering the persistence mechanism.
- **Assumptions:** Toggle and localStorage persistence continue working unchanged. Only the initial/default state changes.
- **Edge cases:** Flash of incorrect theme (FOIT) — the inline script in `layout.js` must also default to light to prevent a dark flash before React hydrates.
- **Dependencies:** `app/providers.js` (ThemeManager) and `app/layout.js` (inline script) are tightly coupled on the default value.
- **Acceptance criteria:** New users (no `rad-theme` in localStorage) see light mode. Existing users with a stored preference are unaffected.

### 🏗️ Architecture Decision
Two files, three small changes:

1. **`app/layout.js`** — Flip the inline script default from dark to light.
2. **`app/providers.js`** — Change `isDark` initial state from `true` to `false`, and flip the fallback in useEffect.

No new files. No new dependencies.

### 📋 Plan Review
**APPROVED** — Minimal, correct, reversible. Two files only.

### 🔒 Security Review
**CLEAR** — No security implications. Purely cosmetic theme default change.

### 🧪 Test Plan
- Clear localStorage (`localStorage.removeItem('rad-theme')`), reload — should see light mode.
- Toggle to dark, reload — dark mode should persist.
- Toggle back to light, reload — light mode should persist.
- No existing automated tests affected.

## Relevant Files
- `app/layout.js` — Contains inline script that sets theme before React hydrates (prevents flash)
- `app/providers.js` — Contains ThemeManager with `isDark` state and localStorage logic

### New Files
None.

## Step by Step Tasks

### Step 1: Update inline script in layout.js (Architect recommendation)
- In `app/layout.js`, change the inline script so that when no stored theme exists, it defaults to light mode (removes `dark` class) instead of dark mode.
- Change the else branch to remove `dark` class instead of adding it.

### Step 2: Update ThemeManager defaults in providers.js (Architect recommendation)
- Change `useState(true)` to `useState(false)` for `isDark`.
- Change the ThemeContext default from `isDark: true` to `isDark: false`.
- Change the fallback in useEffect from `true` (dark) to `false` (light).

### Step 3: Manual validation (Test Engineer recommendation)
- Clear localStorage and verify light mode is the default.
- Verify toggle still works and persists correctly.

## Validation Commands
- Manual browser testing (clear localStorage, reload, verify light mode)
- Toggle dark/light and verify persistence

## Notes
The inline script in layout.js is critical — it runs before React hydrates to prevent a flash of the wrong theme. Both files must agree on the default.
