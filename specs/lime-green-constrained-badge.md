# Chore: Lime Green Constrained Badge

## Chore Description
On the Scores page, the "Growth System Constrained" maturity band badge should display in lime green. Currently broken because Tailwind CSS purges the dynamically-constructed `bg-lime-500` class (no full string reference exists in the codebase).

## Agent Reports

### Scope Analysis
- **What exactly is being asked?** Fix the badge color on the Scores page so that when `maturityBand` is "Growth System Constrained" (65-79%), the badge renders with a lime green background.
- **What is NOT being asked?** Not fixing the same issue on `app/page.js` or `ProjectDetailPage.js` (those have separate band-color bugs but are separate pages).
- **Assumptions:** The scoring logic in `route.js` correctly assigns "Growth System Constrained" for scores 65-79 — verified. The issue is purely CSS/Tailwind rendering.
- **Edge cases:** All 4 band colors must still work (emerald, lime, amber, rose).
- **Acceptance criteria:** Score of 75.1 displays a lime green badge reading "GROWTH SYSTEM CONSTRAINED".

### Architecture Decision
**Root cause:** `ScoresPage.js` used template literal `` bg-${bandColor}-500 `` — Tailwind's JIT compiler cannot detect `bg-lime-500` from dynamic interpolation, so the class is never generated.

**Fix:** Replace dynamic class interpolation with full static class strings in a ternary chain. 1 file, 2 line changes.

### Plan Review
**Verdict: APPROVED** — Minimal, reversible, follows Tailwind best practices.

### Security Review
**Verdict: CLEAR** — Pure CSS class name change.

### Test Plan
- Manual: Navigate to scores page and verify lime green badge for "Constrained" band
- Manual: Verify all 4 band colors render correctly

## Relevant Files
- `components/scores/ScoresPage.js` — Badge rendering with band color logic

### New Files
None

## Step by Step Tasks

### Step 1: Replace dynamic band color with static class strings
- Replace ternary chain returning color tokens with one returning full Tailwind class strings
- Replace template literal in Badge className with the new variable

## Validation Commands
- Manual: check scores page for lime green badge
