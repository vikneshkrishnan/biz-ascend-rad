# Chore: Fix 'sortedPillars' before initialization error in PDF export

## Chore Description
PDF export fails with `Cannot access 'sortedPillars' before initialization` because `sortedPillars` is used on line 579 (Executive Summary radar chart) but declared with `const` on line 638 (Growth System Diagnostic Overview section).

## Agent Reports

### 🔍 Scope Analysis
- **What exactly is being asked?** Move the `sortedPillars` variable declaration before its first usage to fix a temporal dead zone (TDZ) error.
- **What is NOT being asked?** No refactoring, no new features, no changes to scoring logic or PDF layout.
- **Assumptions:** The variable `pillarScores` (used to build `sortedPillars`) is available from line 72 onward, so moving the declaration earlier is safe.
- **Edge cases:** If `pillarScores` is empty, `sortedPillars` will be an empty array — the existing `if (sortedPillars.length >= 3)` guard on line 579 handles this.
- **Acceptance criteria:** PDF export generates without the TDZ error; no change to output content.

### 🏗️ Architecture Decision
**Single file change:** `lib/generatePdf.js`

**Strategy:** Move `const sortedPillars = Object.entries(pillarScores).sort(...)` from line 638 to before line 579 (after the utility functions, before Section 1: Executive Summary). Remove the duplicate declaration at line 638.

**Tradeoffs:** None — this is the only correct fix. Moving it earlier doesn't change behavior since `pillarScores` is already defined.

### 📋 Plan Review
**APPROVED** — Minimal, correct, and reversible single-line move.

### 🔒 Security Review
**CLEAR** — No security implications. This is a variable reordering within a pure PDF generation function.

### 🧪 Test Plan
- **Validation:** Run the app and trigger PDF generation to confirm no TDZ error.
- **Manual check:** Verify the generated PDF contains the radar chart in the Executive Summary and the pillar table in Section 3.
- **No existing automated tests to break.**

## Relevant Files
- `lib/generatePdf.js` — Contains the bug (TDZ error with `sortedPillars`)

### New Files
None.

## Step by Step Tasks

### Step 1: Move `sortedPillars` declaration before first usage
- Move `const sortedPillars = Object.entries(pillarScores).sort(([a], [b]) => a.localeCompare(b))` from line 638 to just before the Executive Summary radar chart block (before line 579).
- Remove the now-duplicate declaration at the original location (line 638).

## Validation Commands
- `yarn build` — Ensure no build errors
- Manual: trigger PDF export in the app

## Notes
- Root cause: code was likely added in stages — the radar chart in Executive Summary was added after the pillar table section, referencing a variable that hadn't been hoisted.
