# Chore: Use white background for the login

## Chore Description
Change the login page and forgot password page background from the dark navy color (`bg-[hsl(222,47%,5%)]`) to white (`bg-white`).

## Agent Reports

### 🔍 Scope Analysis

**What exactly is being asked?**
Change the background color of the login page wrapper div from `bg-[hsl(222,47%,5%)]` (dark navy) to `bg-white` in both the `LoginPage` and `ForgotPasswordPage` components in `components/auth/LoginPage.js`.

**What is NOT being asked?**
- Not changing the card styling, form layout, or any UI elements inside the card
- Not changing text colors or other theme elements
- Not adding dark mode support for the background

**What assumptions are we making?**
1. "White background" means `bg-white` (pure white `#ffffff`) — **low risk assumption**.
2. The card border and existing text colors will remain readable against a white background — **needs verification**: the card already has `border-2` and `bg-background`, so it will look fine. Text inside the card uses theme colors.
3. The `relative` positioning class on the parent div is still needed for the card's `z-10` — technically no longer needed since the video/overlay are gone, but harmless to keep.

**Ambiguities:**
- None significant. "White" is unambiguous.

**Edge cases:**
- The card uses `bg-background` which in light mode is already white — the card border (`border-2`) ensures visual separation.

**Dependencies touched:**
- Only `components/auth/LoginPage.js` — no upstream/downstream impacts.

**Acceptance criteria:**
1. Both `LoginPage` and `ForgotPasswordPage` wrappers use `bg-white` instead of `bg-[hsl(222,47%,5%)]`
2. All existing tests pass
3. Build succeeds

### 🏗️ Architecture Decision

**Minimal set of changes:**

| # | File | Action |
|---|------|--------|
| 1 | `components/auth/LoginPage.js` | Replace `bg-[hsl(222,47%,5%)]` with `bg-white` on line 38 and line 111 |

**Change strategy:** Simple class name replacement in two locations within the same file.

**New dependencies:** None.

### 📋 Plan Review

**Verdict: APPROVED**

- Plan is minimal — two class name changes in one file.
- No risk of breaking intermediate states.
- Fully reversible via git revert.

### 🔒 Security Review

**Verdict: CLEAR**

Pure CSS change. No security implications.

### 🧪 Test Plan

**Existing tests that could break:** None — no tests assert background color.

**New tests needed:** None.

**Validation sequence:**
1. `npx next build` — Ensure build succeeds
2. Manual: verify login and forgot password pages show white background

## Relevant Files

- `components/auth/LoginPage.js` — Contains both components with the background color to change

### New Files
None.

## Step by Step Tasks

### Step 1: Update background color in both components (Architect)
- In `components/auth/LoginPage.js`, replace `bg-[hsl(222,47%,5%)]` with `bg-white` in both `LoginPage` (line 38) and `ForgotPasswordPage` (line 111)

### Step 2: Validate (Test Engineer)
- Run build to confirm no regressions

## Validation Commands

- `npx next build` — Ensure build succeeds

## Notes
- This is a trivial cosmetic change affecting two lines in one file.
