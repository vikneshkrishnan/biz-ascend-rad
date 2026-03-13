# Chore: Add Logo to Report Cover Page

## Chore Description
Replace the red "RAD" box placeholder on the PDF report's cover page with the actual Biz Ascend logo (`public/logo.jpeg`).

## Agent Reports

### Scope Analysis
- **What:** Add `public/logo.jpeg` (1600x401, ~4:1 ratio) to the cover page of the jsPDF-generated report, replacing the current red rounded-rect "RAD" placeholder.
- **Not in scope:** Logo on other pages, logo in the web UI.
- **Key constraint:** `generateClientPdf` is currently synchronous. Loading an image requires async. Must convert function to async and update all callers with `await`.

### Architecture Decision
**Strategy:** Make `generateClientPdf` async. Fetch `/logo.jpeg` at runtime, convert to base64 via canvas, use `doc.addImage()`.

**Files to modify (3):**
1. `lib/generatePdf.js` — Make async, add image loading helper, replace RAD box with logo image
2. `components/scores/ScoresPage.js` — Add `await` to `generateClientPdf()` call
3. `app/page.js` — Add `await` to `generateClientPdf()` call (if present)

### Plan Review
**APPROVED**

### Security Review
**CLEAR** — Loading a local static asset, no user input involved.

### Test Plan
- `npm run build` — Verify build passes
- Manual: Download PDF and verify logo appears on cover page

## Step by Step Tasks

### Step 1: Update lib/generatePdf.js
- Add async image loader helper function
- Make `generateClientPdf` async
- Replace the red "RAD" rounded-rect with the logo image, centered, appropriately sized

### Step 2: Update callers
- `components/scores/ScoresPage.js` — add `await` before `generateClientPdf(...)`
- `app/page.js` — add `await` before `generateClientPdf(...)` if called there

## Validation Commands
- `npm run build`
