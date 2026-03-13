# Chore: PDF Report Formatting — Proper Gaps and Black Text

## Chore Description
Improve the generated PDF report formatting: use black text color for body content and ensure proper spacing/gaps between sections and elements.

## Agent Reports

### 🔍 Scope Analysis
- **What exactly is being asked?** Change text colors to black and increase vertical spacing throughout the PDF.
- **What is NOT being asked?** No layout restructuring, no new sections, no changes to the web UI.
- **Assumptions:** "Black text" means `[0, 0, 0]` for primary body text. "Proper gaps" means more vertical whitespace between sections and cards.
- **Acceptance criteria:** PDF body text renders in black. Sections have clear visual separation with adequate whitespace.

### 🏗️ Architecture Decision
**File:** `lib/generatePdf.js` only.

**Changes:**
1. Change `COLORS.dark` from `[31, 41, 55]` to `[0, 0, 0]` (true black)
2. Increase `sectionTitle` gap after underline from 8mm to 12mm
3. Increase `bodyText` trailing gap from 2mm to 4mm
4. Increase pillar card spacing from 4mm to 8mm between cards
5. Change pillar narrative text color from `COLORS.medium` to `COLORS.dark` (now black)
6. Increase TOC item spacing from 9mm to 12mm
7. Increase spacing after score overview cards from 36mm to 42mm
8. Increase spacing between action plan phases from 6mm to 10mm
9. Increase spacing after executive summary box from 8mm to 12mm

### 📋 Plan Review
**APPROVED** — All changes are cosmetic, confined to one file.

### 🔒 Security Review
**CLEAR** — No security implications.

### 🧪 Test Plan
- Manual: Generate PDF, verify black text and improved spacing.

## Relevant Files
- `lib/generatePdf.js` — PDF generation logic (only file modified)

## Step by Step Tasks
### Step 1: Update COLORS.dark to true black
### Step 2: Increase section title spacing
### Step 3: Increase body text trailing gap
### Step 4: Increase TOC item spacing
### Step 5: Increase executive summary bottom spacing
### Step 6: Increase score overview bottom spacing
### Step 7: Change pillar narrative to black and increase card gaps
### Step 8: Increase action plan phase gaps
### Step 9: Increase RAPS section spacing

## Validation Commands
- `npx next build` — Verify no build errors
- Manual PDF generation test
