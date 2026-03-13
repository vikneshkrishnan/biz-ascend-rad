# Chore: Update Band Colors Across Application and Report

## Chore Description
Replace all maturity band colors with new color scheme:
- < 50% At Risk: Red #DC3545 (rgb 220,53,69)
- 50-64% Underpowered: Dark Orange #FF8C00 (rgb 255,140,0)
- 65-79% Constrained: Lime Green #32CD32 (rgb 50,205,50)
- 80-100% Strong: Green #28A745 (rgb 40,167,69)

## Agent Reports

### 🔍 Scope Analysis
- **What exactly is being asked?** Replace the 4 maturity band colors everywhere they appear: UI components (Tailwind classes), PDF report (RGB arrays), constants, and config.
- **What is NOT being asked?** General UI colors (completed status green dots, trend indicators, pending amber) should NOT change — only band/maturity score colors.
- **Assumptions:** The new hex colors are exact requirements. We'll use custom Tailwind colors since these don't map to standard Tailwind palette.
- **Edge cases:** Dynamic Tailwind class construction (e.g. `bg-${color}-500`) needs special handling — safelist must cover all new classes.
- **Acceptance criteria:** All 4 maturity bands render in the new colors in both the web UI and the PDF report.

### 🏗️ Architecture Decision
**Strategy:** Add custom `band` colors to Tailwind config, then replace all band-specific color references.

**Files to modify (7 files):**

1. `tailwind.config.js` — Add custom band colors + update safelist
2. `lib/constants.js` — Update MATURITY_BANDS color labels
3. `lib/generatePdf.js` — Update RGB values in COLORS object, getBandColor(), getBandLabel(), gauge segments, action plan phase bg colors
4. `components/scores/ScoresPage.js` — Update bandClasses, bandColor(), constraint box colors, legend dots, action plan phase colors
5. `components/projects/ProjectDetailPage.js` — Update Badge band color ternary
6. `app/page.js` — Update bandClasses, bandColor(), constraint box colors, legend dots (mirrors ScoresPage)
7. `components/shared/ui-helpers.js` — NO CHANGES needed (uses emerald/rose for trends, not bands)

### 📋 Plan Review
**APPROVED** — Clean separation between band colors and general UI colors. Custom Tailwind colors avoid ambiguity.

### 🔒 Security Review
**CLEAR** — Purely cosmetic changes, no user input handling affected.

### 🧪 Test Plan
- `npm run build` — Verify no compilation errors and all Tailwind classes resolve
- Manual: check ScoresPage renders correct band colors
- Manual: download PDF and verify band colors in tables, gauge, charts

## Relevant Files
- `tailwind.config.js` — Tailwind config with safelist and custom colors
- `lib/constants.js` — MATURITY_BANDS definitions
- `lib/generatePdf.js` — PDF generation with RGB color arrays
- `components/scores/ScoresPage.js` — Scores UI with band colors
- `components/projects/ProjectDetailPage.js` — Project detail with band badge
- `app/page.js` — Main page with band colors (mirrors ScoresPage patterns)

### New Files
None

## Step by Step Tasks

### Step 1: Add custom band colors to Tailwind config
- Add `band: { risk: '#DC3545', underpowered: '#FF8C00', constrained: '#32CD32', strong: '#28A745' }` to theme.extend.colors
- Update safelist to include all `bg-band-*`, `text-band-*`, `border-band-*`, `shadow-band-*` classes with opacity variants

### Step 2: Update lib/constants.js
- Change MATURITY_BANDS color values to new color tokens

### Step 3: Update lib/generatePdf.js
- Update COLORS object: green→[40,167,69], yellow→[50,205,50], orange→[255,140,0], red/rose→[220,53,69]
- Update getBandColor() thresholds to use new colors
- Update getBandLabel() — Constrained should be 'Lime Green' or 'Green'
- Update gauge segment colors
- Update action plan phase colors and background colors

### Step 4: Update components/scores/ScoresPage.js
- Replace bandClasses with band-* classes
- Replace bandColor() with band-* classes
- Update primary constraint box from rose to band-risk
- Update legend dots
- Update action plan phase colors

### Step 5: Update components/projects/ProjectDetailPage.js
- Replace Badge color ternary with band-* classes

### Step 6: Update app/page.js
- Same changes as ScoresPage (bandClasses, bandColor, constraint box, legend dots)

## Validation Commands
- `npm run build` — Verify build passes with zero errors

## Notes
- `emerald-500` used for "completed" status dots and trend indicators is NOT a band color — leave unchanged
- `rose-500` in ui-helpers.js for negative trends is NOT a band color — leave unchanged
- `amber-500` for pending status is NOT a band color — leave unchanged
