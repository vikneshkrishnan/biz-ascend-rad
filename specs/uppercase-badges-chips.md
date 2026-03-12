# Chore: Uppercase All Badges and Chips

## Chore Description
All badge and chip components throughout the application should render their text content in uppercase.

## Agent Reports

### 🔍 Scope Analysis
- **What exactly is being asked?** Add CSS `uppercase` text-transform to all Badge/chip-like UI elements so their displayed text is always uppercase.
- **What is NOT being asked?** We are not changing the underlying data values, only their visual rendering. We are not redesigning badges or changing colors/sizes.
- **Assumptions:** "Badges and chips" refers to all `<Badge>` component usages (from `components/ui/badge.jsx`), the `StatusBadge` helper, the local Badge in CreateProjectPage, and the inline StatusBadge in `app/page.js`. Trend percentage indicators (e.g., "+5%") are numeric displays, not badges.
- **Edge cases:** Some badges already use `uppercase` class or `.toUpperCase()` — these will be harmless duplicates. Badges using `capitalize` CSS class need to be changed to `uppercase` to avoid conflict.
- **Acceptance criteria:** Every Badge/chip in the app renders text in uppercase regardless of the input data casing.

### 🏗️ Architecture Decision
**Strategy:** Add `uppercase` to the base Badge component's CVA class string. This single change propagates to ~90% of badge usages. Then fix edge cases: the local Badge in CreateProjectPage and the inline StatusBadge in app/page.js. Change `capitalize` to `uppercase` where used on Badge instances.

**Files to modify (5):**
1. `components/ui/badge.jsx` — Add `uppercase` to base CVA classes
2. `components/projects/CreateProjectPage.js` — Add `uppercase` to local Badge component
3. `app/page.js` — Add `uppercase` to inline StatusBadge span
4. `components/users/AdminUsersPage.js` — Change `capitalize` → `uppercase` on Badge className
5. `components/layout/AppShell.js` — Change `capitalize` → `uppercase` on Badge className

### 📋 Plan Review
**APPROVED** — Minimal changes, single foundational change covers most cases. Edge cases handled individually.

### 🔒 Security Review
**CLEAR** — Pure CSS/visual change with no security implications.

### 🧪 Test Plan
- No existing tests should break (text-transform is visual only)
- Manual validation: check all pages with badges render text in uppercase
- Validation commands: `npm run build` to ensure no build errors

## Relevant Files
- `components/ui/badge.jsx` — The shared Badge component (foundational change)
- `components/projects/CreateProjectPage.js` — Local Badge component definition
- `app/page.js` — Inline StatusBadge function
- `components/users/AdminUsersPage.js` — Badge with `capitalize` class
- `components/layout/AppShell.js` — Badge with `capitalize` class

### New Files
None.

## Step by Step Tasks

### Step 1: Add `uppercase` to shared Badge component (Architect)
- In `components/ui/badge.jsx`, add `uppercase` to the CVA base class string

### Step 2: Add `uppercase` to local Badge in CreateProjectPage (Architect)
- In `components/projects/CreateProjectPage.js` line 266, add `uppercase` to the span className

### Step 3: Add `uppercase` to inline StatusBadge in app/page.js (Architect)
- In `app/page.js` line 120, add `uppercase` to the span className

### Step 4: Change `capitalize` to `uppercase` on AdminUsersPage badges (Scope Analyst)
- In `components/users/AdminUsersPage.js` lines 137 and 142, change `capitalize` → `uppercase`

### Step 5: Change `capitalize` to `uppercase` on AppShell badge (Scope Analyst)
- In `components/layout/AppShell.js` line 95, change `capitalize` → `uppercase`

## Validation Commands
- `npm run build` — Ensure no build errors

## Notes
- Some badges already have `uppercase` class or use `.toUpperCase()` — these are harmless duplicates and don't need removal (keeping them is safer and avoids unnecessary churn).
