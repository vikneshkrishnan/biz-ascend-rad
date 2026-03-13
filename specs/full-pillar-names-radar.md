# Chore: Show full pillar names on radar chart

## Chore Description
Update the radar chart on the scores page to display full pillar dimension names instead of just the first word. Also fix the `PILLAR_NAMES` constant where `p6` says "Revconomics" instead of "Revenue Economics".

## Agent Reports

### 🔍 Scope Analysis

**What exactly is being asked?**
1. Change the radar chart labels from truncated first-word names (e.g., "Commercial", "ICP", "Positioning") to the full dimension names (e.g., "Commercial Baseline", "ICP & Buyer Urgency").
2. Fix `p6` in `PILLAR_NAMES` from `'Revconomics'` to `'Revenue Economics'`.

**What is NOT being asked?**
- Not changing pillar order, scoring logic, or any other UI components
- Not changing the pillar list section below the radar chart (it already shows full names via `pillarLabel()`)

**What assumptions are we making?**
1. Long names like "Positioning & Competitive Clarity" and "Systems Readiness & AI Transformation" may overflow or overlap on the radar chart — the font size (currently `fontSize: 10`) or chart margins may need adjustment.
2. The `DIAGNOSTIC_PILLARS` array (line 82+) may also have the wrong name for p6 — **needs verification**.

**Ambiguities:**
- Should the radar labels wrap to multiple lines for long names? Recharts `PolarAngleAxis` doesn't natively support multi-line labels, but a custom tick component can handle it.

**Edge cases:**
- Very long names like "Organisational Alignment & Capability" (~38 chars) and "Systems Readiness & AI Transformation" (~38 chars) will likely overlap adjacent labels at `fontSize: 10`. Need a custom tick renderer or smaller font.

**Acceptance criteria:**
1. Radar chart shows full pillar names
2. Labels don't overlap or get cut off
3. `PILLAR_NAMES.p6` reads "Revenue Economics"
4. Build passes

### 🏗️ Architecture Decision

**Changes required:**

| # | File | Action |
|---|------|--------|
| 1 | `lib/constants.js` | Fix `p6` from `'Revconomics'` to `'Revenue Economics'` |
| 2 | `components/scores/ScoresPage.js` | Change `radarData` mapping to use full name instead of `.split(' ')[0]`. Add custom tick renderer for `PolarAngleAxis` to handle long labels (wrap text or reduce font size). |

**Change strategy:**
- In `radarData` (line 178): change `PILLAR_NAMES[pid]?.split(' ')[0]` to `PILLAR_NAMES[pid]`
- Add a custom `tick` component for `PolarAngleAxis` that renders the full name at a smaller font size (8px) with possible line wrapping for names over ~20 chars
- Increase radar chart margins to accommodate longer labels

**New dependencies:** None.

### 📋 Plan Review

**Verdict: APPROVED**

- Minimal changes in 2 files
- Custom tick renderer is standard Recharts pattern
- Fully reversible

### 🔒 Security Review

**Verdict: CLEAR**

Pure display-only change.

### 🧪 Test Plan

**Existing tests that could break:** `tests/e2e/scores-report.spec.ts` may reference pillar names — needs checking.
**New tests:** None needed.
**Validation:** `npx next build`

## Relevant Files

- `lib/constants.js` — Contains `PILLAR_NAMES` with the typo to fix
- `components/scores/ScoresPage.js` — Contains radar chart with truncated labels

### New Files
None.

## Step by Step Tasks

### Step 1: Fix PILLAR_NAMES p6 (Scope Analyst)
- Change `'Revconomics'` to `'Revenue Economics'` in `lib/constants.js`

### Step 2: Update radar chart to show full pillar names (Architect)
- Change `radarData` to use full `PILLAR_NAMES[pid]` instead of `.split(' ')[0]`
- Add custom tick renderer for `PolarAngleAxis` to handle long labels
- Adjust chart margins if needed

### Step 3: Validate (Test Engineer)
- Run build

## Validation Commands

- `npx next build` — Ensure build succeeds

## Notes
- Also need to check if `DIAGNOSTIC_PILLARS` array has the same p6 typo.
