# Chore: Replace Four Action Buttons with Single PDF Report Button

## Chore Description
Remove the four buttons (CSV Data, Send Report, Final Report, Generate AI Intelligence) from the scores page header in `app/page.js` and replace them with a single "Generate Report" button that generates and downloads a client-side PDF using `generateClientPdf` from `lib/generatePdf.js`. Also remove associated dead code: unused state variables, functions, and dialogs (AI Report Dialog, Send Dialog).

## Agent Reports

### 🔍 Scope Analysis
- **What exactly is being asked?** Remove four action buttons from the scores page header bar in `app/page.js` (lines 2312–2329) and replace with a single "Generate Report" PDF button. Clean up dead code that becomes unreachable.
- **What is NOT being asked?** No changes to `components/scores/ScoresPage.js` (already has the correct single-button pattern). No changes to `lib/generatePdf.js`. No backend changes.
- **Assumptions:** The client-side `generateClientPdf` from `lib/generatePdf.js` is the desired PDF approach (matches the pattern already in `components/scores/ScoresPage.js`).
- **Edge cases:** The `downloadPdf` function currently fetches report data via API before generating — we should keep that behavior so the PDF includes AI-generated narratives if available.
- **Acceptance criteria:** Scores page shows a single "Generate Report" button; clicking it downloads a PDF. No CSV, Send, Final Report, or Generate AI Intelligence buttons visible. No broken references or console errors.

### 🏗️ Architecture Decision
**Strategy:** Modify the `app/page.js` `ScoresPage` function to:
1. Add `import { generateClientPdf } from '@/lib/generatePdf'`
2. Replace the four buttons with a single PDF download button
3. Rewrite `downloadPdf` to use `generateClientPdf` (client-side) instead of server API
4. Remove dead code: `generateReport`, `loadReport`, `exportToCSV`, `sendToClient` functions
5. Remove dead state: `generating`, `showReport`, `report`, `showSendDialog`, `sendingEmail`, `emailForm`
6. Remove AI Report Dialog and Send Dialog JSX

**Files modified:** `app/page.js` only

### 📋 Plan Review
**APPROVED** — Minimal changes, follows existing pattern from `components/scores/ScoresPage.js`.

### 🔒 Security Review
**CLEAR** — No new user input handling, no new dependencies. Removing the email send functionality is actually a security surface reduction.

### 🧪 Test Plan
- Manual: Navigate to scores page, verify single "Generate Report" button appears
- Manual: Click button, verify PDF downloads with correct company name
- Manual: Verify no console errors
- No automated tests to break (no test files reference these buttons)

## Relevant Files
- `app/page.js` — Contains the `ScoresPage` function with the four buttons to remove (primary file)
- `lib/generatePdf.js` — Client-side PDF generator to import (read-only reference)
- `components/scores/ScoresPage.js` — Reference implementation with single-button pattern (read-only reference)

### New Files
None

## Step by Step Tasks

### Step 1: Add `generateClientPdf` import to `app/page.js`
- Add import after existing imports (Architect)

### Step 2: Remove unused state variables from ScoresPage function
- Remove: `generating`, `showReport`, `report`, `showSendDialog`, `sendingEmail`, `emailForm` (Architect)

### Step 3: Remove dead functions
- Remove: `generateReport`, `loadReport`, `exportToCSV`, `sendToClient` (Architect)

### Step 4: Rewrite `downloadPdf` to use client-side generation
- Use `generateClientPdf` pattern from `components/scores/ScoresPage.js` (Architect)

### Step 5: Replace four buttons with single "Generate Report" button
- Replace the `<div className="flex flex-wrap gap-2">` block with a single `<Button>` (Architect)

### Step 6: Remove AI Report Dialog and Send Dialog JSX
- Remove the two `<Dialog>` blocks at bottom of ScoresPage return (Architect)

## Validation Commands
- Manual browser test at `http://localhost:3002/#/projects/<id>/scores`

## Notes
- The `components/scores/ScoresPage.js` already has the desired single-button pattern — we're aligning `app/page.js` to match.
