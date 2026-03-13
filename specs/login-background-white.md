# Chore: Login Background White

## Chore Description
Change the login page background from dark navy (`bg-[hsl(222,47%,5%)]`) with video overlay to a plain white background. This affects the LoginPage, ForgotPasswordPage, and SignupPage components in `app/page.js`.

## Agent Reports

### 🔍 Scope Analysis

**What exactly is being asked?**
Change the background of the login/auth pages from a dark navy color with video background to white.

**What is NOT being asked?**
- No changes to the login form card styling itself
- No changes to authentication logic
- No changes to form fields, buttons, or functionality
- No changes to the separate `components/auth/LoginPage.js` (already has `bg-white`)

**What assumptions are we making?**
- "Login background" includes the ForgotPasswordPage and SignupPage since they share the same dark background pattern
- The video background element and dark overlay should be removed (they don't make sense on a white background)
- Text colors that were white (for dark bg contrast) need to change to dark colors for white bg readability
- The "Explore Demo" button and signup link text styling needs updating for white bg contrast

**What ambiguities exist?**
- Should the video background be removed entirely or just hidden? → Remove it (no purpose on white bg)
- Should the approach match the existing `components/auth/LoginPage.js` white style? → Yes, use it as reference

**What edge cases could bite us?**
- White text on white background if we miss updating text colors
- The "Explore Demo" button currently has `border-white/30 text-white` which will be invisible on white

**Dependencies touched:**
- Only `app/page.js` — the 3 auth page components

**Acceptance criteria:**
- Login, ForgotPassword, and Signup pages all have white backgrounds
- All text is readable (no white-on-white)
- Video element and dark overlay removed
- Card and form styling remains intact

### 🏗️ Architecture Decision

**Minimal set of changes:** 1 file — `app/page.js`

**Change strategy for each of the 3 components (LoginPage, ForgotPasswordPage, SignupPage):**
1. Change `bg-[hsl(222,47%,5%)]` → `bg-white`
2. Remove `overflow-hidden` (no longer needed without video)
3. Remove `<video>` element
4. Remove `<div className="absolute inset-0 bg-black/40" />` overlay
5. Update heading text from `text-white` → `text-gray-900`
6. Update subtitle text from `text-white/70` → `text-gray-500`
7. Update "Explore Demo" button from white border/text to dark styling
8. Update signup/login link text from `text-white/70` → `text-gray-500`

**Patterns to follow:** Match the styling approach in `components/auth/LoginPage.js` which already has a clean white background design.

### 📋 Plan Review
**APPROVED** — Plan is minimal, targets only the necessary styling changes, and follows existing patterns.

### 🔒 Security Review
**CLEAR** — Pure CSS/styling changes with no security implications.

### 🧪 Test Plan

**Existing tests that could break:**
- `tests/e2e/core-flows.spec.ts` — may reference login page elements (no class-based selectors expected, uses data-testid)
- `tests/e2e/forgot-password.spec.ts` — same, uses data-testid

**Validation sequence:**
1. Visual inspection of login, forgot password, and signup pages
2. `cd /Users/viknesh/workspace/biz-ascend-rad && npx jest --passWithNoTests` (if applicable)

**Manual checks:**
- Verify all text is readable on white background
- Verify login form card styling is intact
- Verify Explore Demo button is visible and clickable

## Relevant Files

- `app/page.js` — Contains LoginPage (line 134), ForgotPasswordPage (line 217), and SignupPage (line 318) with the dark backgrounds that need to change to white

### New Files
None

## Step by Step Tasks

### Step 1: Update LoginPage background and remove video (lines 159-213)
- Change `bg-[hsl(222,47%,5%)]` → `bg-white` and remove `overflow-hidden`
- Remove the `<video>` element (lines 160-167)
- Remove the dark overlay `<div>` (line 168)
- Change `text-white` → `text-gray-900` on heading
- Change `text-white/70` → `text-gray-500` on subtitle
- Update "Explore Demo" button: `border-white/30 text-white bg-transparent hover:bg-transparent hover:border-white/60` → `border-gray-300 text-gray-700 hover:bg-gray-50`
- Update signup link wrapper: `text-white/70` → `text-gray-500`

### Step 2: Update ForgotPasswordPage background and remove video (lines 251-314)
- Change `bg-[hsl(222,47%,5%)]` → `bg-white` and remove `overflow-hidden`
- Remove the `<video>` element (lines 253-259)
- Remove the dark overlay `<div>` (line 261)
- Change `text-white` → `text-gray-900` on heading
- Change `text-white/70` → `text-gray-500` on subtitle

### Step 3: Update SignupPage background and remove video (line 353+)
- Same pattern as Steps 1 and 2

### Step 4: Validate
- Run tests and visual check

## Validation Commands
- Visual inspection of login/forgot-password/signup pages in browser

## Notes
- The `components/auth/LoginPage.js` file already has `bg-white` — it appears to be an older/alternate version not currently used by the main app. The actual auth pages are defined inline in `app/page.js`.
