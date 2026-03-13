# Chore: Growth System Band Colors

## Chore Description
Align all maturity band badge colors across the entire app to match the scoring guide:
- **< 50% At Risk** → Red (`bg-rose-500`)
- **50-64% Underpowered** → Dark Orange (`bg-orange-600`)
- **65-79% Constrained** → Yellow-Green / Lime (`bg-lime-500`)
- **80-100% Strong** → Green (`bg-emerald-500`)

## Agent Reports

### Scope Analysis
- **What exactly is being asked?** Update all maturity band badge color mappings across all pages to use the correct 4-color scheme per the scoring guide. Replace dynamic Tailwind class interpolation with full static class strings so Tailwind JIT can detect them.
- **What is NOT being asked?** Not changing scoring thresholds, not changing band labels, not changing the scoring API logic.
- **Assumptions:** The server-side band assignment logic in `route.js` (lines 146-149) is correct and does not need changes.
- **Edge cases:** All 4 bands must render correctly. Dynamic class interpolation (`bg-${x}-500`) causes Tailwind to purge classes — must use full strings.
- **Acceptance criteria:** Every page showing a maturity band badge renders the correct color for all 4 bands.

### Architecture Decision
**Root cause:** Multiple inconsistent band-color mappings across files, plus Tailwind JIT purging dynamically-constructed class names.

**Strategy:** Create a shared helper function in `lib/utils.js` that returns full Tailwind class strings for any band. Use it in all 4 files. This eliminates duplication and ensures consistency.

However, to stay minimal and match codebase conventions (inline ternaries), we'll use inline static class lookups in each file — same pattern, no new abstractions.

**Files to modify (4 files, 6 locations):**

1. `lib/constants.js:216-221` — Update MATURITY_BANDS color values
2. `components/scores/ScoresPage.js:171` — Already partially fixed, update Underpowered color
3. `app/page.js:1253` — Replace binary check with full 4-band mapping
4. `app/page.js:2279` — Fix stale band names + use static classes
5. `app/page.js:2352` — Replace dynamic interpolation with static variable
6. `components/projects/ProjectDetailPage.js:173` — Replace binary check with full 4-band mapping

### Plan Review
**Verdict: APPROVED**
- Covers all locations from scope report
- Minimal changes — no new abstractions, matches existing inline ternary pattern
- No intermediate broken states
- Easily reversible (single commit revert)

### Security Review
**Verdict: CLEAR** — Pure CSS class name changes. No user input, no data exposure, no injection risk.

### Test Plan
- **Manual validation:** Check scores page, project detail page, and app page for correct badge colors across all 4 bands
- **Build check:** `npm run build` should succeed

## Relevant Files
- `lib/constants.js` — MATURITY_BANDS color definitions
- `components/scores/ScoresPage.js` — Scores page band badge
- `app/page.js` — Two locations: project summary badge (line 1253) and scores view badge (line 2279/2352)
- `components/projects/ProjectDetailPage.js` — Project detail page band badge

### New Files
None

## Step by Step Tasks

### Step 1: Update MATURITY_BANDS constants
- In `lib/constants.js`, change Underpowered color from `'amber'` to `'orange'`

### Step 2: Fix ScoresPage.js band colors
- Update line 171 to use `bg-orange-600` for Underpowered instead of `bg-amber-500`

### Step 3: Fix app/page.js project summary badge (line 1253)
- Replace binary Strong/else check with full 4-band static class mapping

### Step 4: Fix app/page.js scores view (lines 2279 + 2352)
- Replace stale band names and dynamic interpolation with correct 4-band static classes

### Step 5: Fix ProjectDetailPage.js badge (line 173)
- Replace binary Strong/else check with full 4-band static class mapping

## Validation Commands
- Manual: verify all pages show correct band colors
