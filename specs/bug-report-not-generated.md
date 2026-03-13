# Bug: "Report not generated yet" error when downloading report

## Bug Description
When clicking "Download Report", the user gets `{error: "Report not generated yet"}`. The ANTHROPIC_API_KEY has been added but reports are never generated because the `POST /projects/:id/report/generate` endpoint is never called from the UI.

## Problem Statement
The `downloadPdf()` function only calls `GET /projects/:id/report` to fetch a pre-existing report. The `generateReport()` function that calls the POST generation endpoint exists but is not wired to any button. There is no way for the user to trigger AI report generation from the frontend.

## Solution Statement
Modify `downloadPdf()` in both `components/scores/ScoresPage.js` and `app/page.js` to auto-generate the report (POST) if no report exists (GET returns 404), then use the generated data for PDF export.

## Steps to Reproduce
1. Complete a diagnostic assessment
2. Navigate to the Scores/Intelligence page
3. Click "Download Report"
4. Error: `{error: "Report not generated yet"}`

## Root Cause Analysis
The `downloadPdf()` function calls `GET /projects/:id/report`. When `report_data` is null in the database, the API returns 404. The catch block silently swallows this and passes `null` report data to `generateClientPdf()`. The `generateReport()` function (which calls POST to generate via Claude) exists but is orphaned — no UI element invokes it.

## Relevant Files
- `components/scores/ScoresPage.js` — Contains `downloadPdf()` and orphaned `generateReport()`. Fix: auto-generate in downloadPdf flow.
- `app/page.js` — Contains duplicate `downloadPdf()` for the embedded scores view. Same fix needed.

## Step by Step Tasks

### Step 1: Update downloadPdf in ScoresPage.js
- When `GET /projects/:id/report` fails (404), call `POST /projects/:id/report/generate` to auto-generate
- Use the generated report data for PDF export
- Show a toast indicating report is being generated

### Step 2: Update downloadPdf in app/page.js
- Same auto-generate logic for the embedded scores page

### Step 3: Validate
- `npx next build`

## Validation Commands
- `npx next build`

## Notes
- The `generateReport()` function in ScoresPage.js can be removed since its logic is now folded into `downloadPdf()`
- The auto-generate adds latency on first download (~30-60s for Claude generation), so a loading state is important
