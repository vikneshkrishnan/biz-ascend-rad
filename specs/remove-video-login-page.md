# Chore: Remove video from the login page

## Chore Description
Remove the background video element from the login page and forgot password page, along with the associated video file from public assets. The dark overlay that accompanied the video should also be removed, and the card styling should be updated to work without the video background.

## Agent Reports

### 🔍 Scope Analysis

**What exactly is being asked?**
Remove the `<video>` element used as a background on the login page (`LoginPage` component) and the forgot password page (`ForgotPasswordPage` component) in `components/auth/LoginPage.js`. Also remove the ~19MB video file (`public/Image_to_video_delpmaspu_.mp4`) from the repository.

**What is NOT being asked?**
- Not changing the login form functionality, layout, or card design
- Not changing the authentication flow
- Not replacing the video with a different background (e.g., image or gradient) — just removing it
- Not modifying the e2e tests (no tests reference the video)

**What assumptions are we making?**
1. The dark background color `bg-[hsl(222,47%,5%)]` on the parent div is sufficient as the background after video removal — **low risk**, it's already the fallback.
2. The `bg-background/80 backdrop-blur-md` on the Card was for readability over the video — these should be updated to `bg-background` since there's nothing to blur/overlay.
3. The `bg-black/40` overlay div exists solely for the video — it should be removed.
4. No other component references the video file — **confirmed via grep**.

**Ambiguities:**
- Should the card keep `backdrop-blur-md`? No — it blurs nothing without the video. Remove it.
- Should the `bg-[hsl(222,47%,5%)]` background stay? Yes — it's the dark theme background.

**Edge cases:**
- The `overflow-hidden` class on the parent div was likely added for the video. Safe to remove but also harmless to keep. Will remove for cleanliness.

**Dependencies touched:**
- No external dependencies. Only `components/auth/LoginPage.js` and the video file.

**Acceptance criteria:**
1. No `<video>` tag in `LoginPage.js`
2. No `bg-black/40` overlay divs in either component
3. Card uses `bg-background` (not `bg-background/80 backdrop-blur-md`)
4. Video file deleted from `public/`
5. Login page renders correctly with dark background
6. All existing tests pass

### 🏗️ Architecture Decision

**Minimal set of changes:**

| # | File | Action |
|---|------|--------|
| 1 | `components/auth/LoginPage.js` | Remove `<video>` element and `bg-black/40` overlay from both `LoginPage` and `ForgotPasswordPage` components. Update card classes. |
| 2 | `public/Image_to_video_delpmaspu_.mp4` | Delete file (~19MB) |

**Change strategy:**
- In `LoginPage` component (lines 39-47): Remove the `<video>` tag (lines 39-46) and the overlay `<div>` (line 47). Update card class from `bg-background/80 backdrop-blur-md` to `bg-background`. Remove `overflow-hidden` from parent div.
- In `ForgotPasswordPage` component (lines 121-129): Same changes — remove `<video>` tag (lines 121-128) and overlay `<div>` (line 129). Update card class. Remove `overflow-hidden` from parent div.
- Delete the video asset.

**Patterns followed:** Existing codebase uses Tailwind utility classes, shadcn Card components. No new patterns introduced.

**Dependency order:** Single file edit + file deletion. No ordering constraints.

**New dependencies:** None.

### 📋 Plan Review

**Verdict: APPROVED**

- Plan is complete — covers both components and the asset file.
- Plan is minimal — no unnecessary changes.
- No intermediate broken states — changes are atomic within one file.
- Reversible — git revert recovers everything.
- Tests: no video-related tests exist; existing e2e tests don't reference the video.

### 🔒 Security Review

**Verdict: CLEAR**

- No user input changes
- No auth/authorization changes
- No data exposure risk
- Removing a large static asset reduces attack surface (no media parsing)
- No new dependencies

### 🧪 Test Plan

**Existing tests that could break:** None — grep confirmed no tests reference the video or mp4 file.

**New tests needed:** None — this is a pure removal chore. Visual verification is sufficient.

**Validation sequence:**
1. `cd /Users/viknesh/workspace/biz-ascend-rad && npx next build` — Ensure build succeeds
2. `cd /Users/viknesh/workspace/biz-ascend-rad && npx jest --passWithNoTests` — Run any existing unit tests
3. Manual: verify login page renders with dark background and no video

**Manual checks:**
- Load login page in browser — should show dark background, no video, card clearly visible
- Navigate to forgot password — same check

## Relevant Files

- `components/auth/LoginPage.js` — Contains both `LoginPage` and `ForgotPasswordPage` components with the video elements to remove
- `public/Image_to_video_delpmaspu_.mp4` — The 19MB video file to delete

### New Files
None.

## Step by Step Tasks

### Step 1: Remove video and overlay from LoginPage component (Architect)
- In `components/auth/LoginPage.js`, remove the `<video>` element (lines 39-46)
- Remove the `<div className="absolute inset-0 bg-black/40" />` overlay (line 47)
- Update parent div: remove `overflow-hidden` class
- Update Card: change `bg-background/80 backdrop-blur-md` to `bg-background`

### Step 2: Remove video and overlay from ForgotPasswordPage component (Architect)
- In `components/auth/LoginPage.js`, remove the `<video>` element (lines 121-128)
- Remove the `<div className="absolute inset-0 bg-black/40" />` overlay (line 129)
- Update parent div: remove `overflow-hidden` class
- Update Card: change `bg-background/80 backdrop-blur-md` to `bg-background`

### Step 3: Delete video file (Architect)
- Delete `public/Image_to_video_delpmaspu_.mp4`

### Step 4: Validate (Test Engineer)
- Run build and tests to confirm no regressions

## Validation Commands

- `cd /Users/viknesh/workspace/biz-ascend-rad && npx next build` — Ensure build succeeds
- `cd /Users/viknesh/workspace/biz-ascend-rad && npx jest --passWithNoTests` — Run unit tests

## Notes
- Removing the 19MB video file will significantly reduce the repository size.
- The `specs/video-login-bg-dark-theme.md` spec that originally added the video still exists for historical reference.
