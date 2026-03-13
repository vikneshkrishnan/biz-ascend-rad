# Chore: Multiple Primary Constraints for Pillars Under 50%

## Chore Description
When multiple pillars score < 50%, ALL of them should be labeled as "Primary Constraint" in the PDF report (Section 5: Pillar-by-Pillar Review) and in the UI. Currently, only the single lowest-scoring pillar gets the badge. Client feedback: all danger-zone pillars need urgent attention and should be flagged equally.

## Agent Reports

### 🔍 Scope Analysis
- **What exactly is being asked?** Change the "PRIMARY CONSTRAINT" badge logic from matching a single `primaryConstraint.id` to checking `score < 50` on each pillar.
- **What is NOT being asked?** Not changing the scoring engine or data model. `primaryConstraint` (lowest pillar) stays for priority ordering (Fix First, advisory workstreams).
- **Assumptions:** The threshold is < 50% (matching the "At Risk" maturity band). Keep `primaryConstraint` as a single object in the scores data for backward compatibility.
- **Edge cases:**
  - Zero pillars < 50% → no badge shown (correct)
  - One pillar < 50% → behaves same as today
  - All pillars < 50% → all get badge (correct per client request)
- **Acceptance criteria:** In the PDF Section 5 and UI pillar lists, every pillar scoring < 50% gets the "PRIMARY CONSTRAINT" badge/styling.

### 🏗️ Architecture Decision
**Strategy:** Change display logic only (not data model). Replace `isPrimary = constraint.id === pid` with `isPrimary = score < 50` in all rendering locations.

**Files to modify (3 files):**
1. `lib/generatePdf.js` — PDF Section 4 (constraint box) + Section 5 (pillar-by-pillar) + Section 12 (Fix First)
2. `components/scores/ScoresPage.js` — UI pillar list isPrimary + constraint display box
3. `app/page.js` — Same as ScoresPage (duplicated UI code)

### 📋 Plan Review
**APPROVED** — Minimal display-only change. No data model changes, fully backward compatible.

### 🔒 Security Review
**CLEAR** — No user input, no external data, purely cosmetic logic change.

### 🧪 Test Plan
- `npm run build` — Verify build passes
- Manual: Generate PDF for a project with 2+ pillars < 50% and verify both get "PRIMARY CONSTRAINT" badge

## Relevant Files
- `lib/generatePdf.js` — PDF rendering with isPrimary check and Section 4 constraint box
- `components/scores/ScoresPage.js` — UI scores page with isPrimary check and constraint box
- `app/page.js` — Main page scores view (mirrors ScoresPage)

### New Files
None

## Step by Step Tasks

### Step 1: Update lib/generatePdf.js
- **Section 4 (Primary Growth Constraint):** Show all pillars < 50% in the constraint highlight box, not just one
- **Section 5 (isPrimary):** Change `const isPrimary = constraint?.id === pid` to `const isPrimary = score < 50`
- **Section 12 (Fix First):** Change to list all < 50% pillars
- **Section 13 (Closing):** Update constraint name reference to handle multiple

### Step 2: Update components/scores/ScoresPage.js
- Change `const isPrimary = scores.primaryConstraint?.id === pid` to `const isPrimary = data.score < 50`
- Update constraint display box to show all < 50% pillar names

### Step 3: Update app/page.js
- Same changes as ScoresPage

## Validation Commands
- `npm run build` — Verify build passes

## Notes
- The `primaryConstraint` field in scores data remains as the single lowest pillar — used for advisory workstreams and priority ordering
- Display logic now uses `score < 50` threshold which aligns with the "At Risk" maturity band
