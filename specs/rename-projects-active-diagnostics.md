# Chore: Rename Active Diagnostics to Incomplete Assessments on Projects Page

## Chore Description
In the Organization Portfolio page (`#/projects`), rename the "Active Diagnostics" stat card label to "Incomplete Assessments" to match the dashboard page which already uses this label.

## Agent Reports

### 🔍 Scope Analysis
**What exactly is being asked?** Change the label text from "Active Diagnostics" to "Incomplete Assessments" on the projects list page stat card.

**What is NOT being asked?** No changes to the data source, filtering logic, icon, or styling. No changes to other pages.

**Assumptions:** Only the label text changes. The underlying stat value (count of active/in_progress projects) remains the same.

**Ambiguities:** None — this is a direct text rename.

**Edge cases:** None — purely cosmetic change.

**Dependencies:** None.

**Acceptance criteria:** Projects list page shows "Incomplete Assessments" instead of "Active Diagnostics" in the stat card.

### 🏗️ Architecture Decision
**Minimal changes required:**
- `components/projects/ProjectsListPage.js` — line 78, change label string from "Active Diagnostics" to "Incomplete Assessments"
- `app/page.js` — line 899, change label string from "Active Diagnostics" to "Incomplete Assessments" (duplicate projects section)

**Change strategy:** Simple string replacement in two files.

**Patterns:** Matches the existing rename already done on the dashboard in `app/page.js:508`.

### 📋 Plan Review
**APPROVED** — Minimal, safe, single-string change in two locations.

### 🔒 Security Review
**CLEAR** — No security implications for a label rename.

### 🧪 Test Plan
- Visual inspection of the projects page at `#/projects`
- Check that the stat card shows "Incomplete Assessments"
- Note: `tests/e2e/core-flows.spec.ts:46` references "Active Diagnostics" — this test checks the dashboard, not the projects page, so it should not be affected. Verify.

## Relevant Files
- `components/projects/ProjectsListPage.js` — Projects list page with stat card (line 78)
- `app/page.js` — Contains duplicate projects section with stat card (line 899)
- `tests/e2e/core-flows.spec.ts` — E2E test that references "Active Diagnostics" (verify scope)

### New Files
None

## Step by Step Tasks

### Step 1: Rename label in ProjectsListPage.js
- Change `"Active Diagnostics"` to `"Incomplete Assessments"` on line 78

### Step 2: Rename label in app/page.js projects section
- Change `"Active Diagnostics"` to `"Incomplete Assessments"` on line 899

### Step 3: Verify E2E test scope
- Confirm the test at `tests/e2e/core-flows.spec.ts:46` tests the dashboard (not projects page) and does not need updating

## Validation Commands
- Visual inspection of `#/projects` page
- `cd /Users/viknesh/workspace/biz-ascend-rad && npx jest --passWithNoTests` - Run client tests

## Notes
- The dashboard already uses "Incomplete Assessments" in `app/page.js:508`
- The `DashboardPage.js:41` component still says "Active Diagnostics" — this may be a stale component, but is out of scope for this chore
