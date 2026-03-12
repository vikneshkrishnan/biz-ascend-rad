# Chore: Auto-scroll to top on "Next Pillar" click

## Chore Description
When the user clicks "Next Pillar" on the diagnostic page, the page should auto-scroll to the top.

## Agent Reports

### 🔍 Scope Analysis
- **What:** Add `window.scrollTo({ top: 0, behavior: 'smooth' })` to the "Next Pillar" button click handler at line 2943 of `app/page.js`.
- **Context:** There are two "next pillar" buttons in `app/page.js`. Line 2117 already scrolls to top. Line 2943 does not — this is the one to fix.
- **Not in scope:** The "Back" button, "Submit Assessment" button, or any other navigation.
- **Acceptance criteria:** Clicking "Next Pillar" on the diagnostic tab scrolls the page to the top smoothly.

### 🏗️ Architecture Decision
**1 file to modify:** `app/page.js`
- Line 2943: Change `onClick={() => setCurrentPillar(currentPillar + 1)}` to also call `window.scrollTo({ top: 0, behavior: 'smooth' })`.

### 📋 Plan Review
**APPROVED** — Single-line behavior addition matching existing pattern at line 2117.

### 🔒 Security Review
**CLEAR**

### 🧪 Test Plan
- `npm run build` — Verify app builds
- Manual: click "Next Pillar" and verify page scrolls to top

## Relevant Files
- `app/page.js` — Contains the "Next Pillar" button handler

### New Files
None.

## Validation Commands
- `npm run build`
