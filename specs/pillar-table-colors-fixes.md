# Chore: Add band colors to pillar performance table & fix Total row

## Chore Description
The pillar performance table in the PDF report needs: (1) colored indicators in the Status column matching the band color scale (emerald/lime/orange/rose), (2) `%` suffix on the Total weighted score, (3) short status text with color for the Total row instead of truncated band name.

## Agent Reports

### 🔍 Scope Analysis
- **What exactly is being asked?** Add colored dot + colored text to the Status column of the pillar performance table, fix Total row's missing `%` and truncated status text.
- **What is NOT being asked?** Not changing other tables, not changing band thresholds, not changing other PDF sections.
- **Assumptions:** The `drawTable` function is generic and used by other tables — changes must be backward-compatible via an optional parameter.
- **Acceptance criteria:**
  1. Each pillar row in the Status column shows a colored dot + colored text matching the band scale
  2. Total row weighted score displays with `%` suffix
  3. Total row Status shows short band label (e.g. "Amber") with matching color dot

### 🏗️ Architecture Decision
**File:** `lib/generatePdf.js`

**Strategy:**
1. Add optional `rowColors` parameter to `drawTable` — array of RGB colors per row
2. When `rowColors[rowIndex]` is set, draw a colored circle + colored text in the last column instead of default black text
3. Fix Total row data: `twSum.toFixed(2) + '%'` and `getBandLabel(radScore)` instead of `getBandName(radScore)`
4. Build `rowColors` array from `getBandColor()` for each pillar + Total row

### 📋 Plan Review
**APPROVED** — Backward-compatible change to drawTable (optional param), plus 2 data fixes.

### 🔒 Security Review
**CLEAR**

### 🧪 Test Plan
- `npx next build`
- Manual: generate PDF, verify colored dots in Status column and `%` on Total row

## Relevant Files
- `lib/generatePdf.js` — drawTable function and pillar table rendering

### New Files
None.

## Step by Step Tasks

### Step 1: Modify drawTable to support rowColors option
- Add `rowColors` to destructured opts
- When rendering the last column of a row, if `rowColors[rowIndex]` exists, draw a colored circle and use colored text

### Step 2: Fix Total row data
- Change `twSum.toFixed(2)` → `twSum.toFixed(2) + '%'`
- Change `getBandName(radScore)` → `getBandLabel(radScore)`

### Step 3: Build and pass rowColors array
- Create `rowColors` from `getBandColor(data.score)` for each pillar
- Add `getBandColor(radScore)` for Total row
- Pass `{ rowColors }` in drawTable opts

## Validation Commands
- `npx next build`
