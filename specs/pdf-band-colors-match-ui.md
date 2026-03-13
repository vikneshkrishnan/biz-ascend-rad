# Chore: Align PDF band colors with System Components UI

## Chore Description
The PDF report's progress bar / band colors don't match the System Components section in the UI. The UI uses `emerald-500`/`lime-500`/`orange-600`/`rose-500` (Tailwind), but the PDF uses `green-500` and `red-500` RGB values instead of `emerald-500` and `rose-500`.

## Agent Reports

### 🔍 Scope Analysis
- **What exactly is being asked?** Update the PDF color constants to match the exact Tailwind CSS color values used by the UI's `bandColor()` function in ScoresPage.
- **What is NOT being asked?** Not changing band thresholds, not changing UI colors, not changing PDF layout.
- **Mismatched colors:**
  - `COLORS.green`: currently `[34, 197, 94]` (green-500), should be `[16, 185, 129]` (emerald-500)
  - `getBandColor` for <50: currently returns `COLORS.red` `[239, 68, 68]` (red-500), should return `COLORS.rose` `[244, 63, 94]` (rose-500)
- **Edge cases:** `COLORS.green` and `COLORS.red` are used in other PDF contexts (gauge, constraint box, action roadmap). Need to decide: update those too, or create separate band-specific colors.
- **Acceptance criteria:** PDF bar/dot colors visually match the UI System Components section.

### 🏗️ Architecture Decision
**File:** `lib/generatePdf.js`

**Strategy:**
1. Update `COLORS.green` → `[16, 185, 129]` to match emerald-500
2. Update `COLORS.rose` → `[244, 63, 94]` to match rose-500
3. Update `getBandColor` to return `COLORS.rose` instead of `COLORS.red` for scores < 50

This keeps `COLORS.red` as-is for non-band uses (constraint highlight box, action roadmap phase 1 accents) where red is intentionally a different shade.

### 📋 Plan Review
**APPROVED** — Minimal 3-line change in one file.

### 🔒 Security Review
**CLEAR**

### 🧪 Test Plan
- `npx next build` — verify build passes
- Manual: generate a PDF and compare bar colors with UI

## Relevant Files
- `lib/generatePdf.js` — Contains COLORS constants and getBandColor function

### New Files
None.

## Step by Step Tasks

### Step 1: Update COLORS.green to emerald-500 RGB
- Change `[34, 197, 94]` → `[16, 185, 129]`

### Step 2: Update COLORS.rose to rose-500 RGB
- Change `[225, 29, 72]` → `[244, 63, 94]`

### Step 3: Update getBandColor to use COLORS.rose for <50
- Change `return COLORS.red` → `return COLORS.rose`

## Validation Commands
- `npx next build`
