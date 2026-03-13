# Chore: Weighted Score Percentage in Pillar Performance Table

## Chore Description
The weighted score column in the Pillar Performance table (PDF report) should display values with a `%` suffix for consistency with the Total row and the Weight column.

## Agent Reports

### 🔍 Scope Analysis
- **What exactly is being asked?** Append `%` to the weighted score values for each pillar row in the Pillar Performance table in the generated PDF report.
- **What is NOT being asked?** No changes to scoring logic, no changes to other tables or charts, no UI changes.
- **Assumptions:** The Total row already shows `%` — this is the intended format for all rows.
- **Ambiguities:** None — the change is clear from the existing Total row pattern.
- **Edge cases:** None — `.toFixed(2)` already handles decimal formatting.
- **Dependencies:** Only `lib/generatePdf.js` is affected.
- **Acceptance criteria:** Each pillar row's "Weighted Score" cell shows e.g. `9.60%` instead of `9.60`.

### 🏗️ Architecture Decision
- **Minimal change:** 1 file, 1 line modified.
- **File:** `lib/generatePdf.js` line 649
- **Change:** Append `+ '%'` to the `weightedScore` string.
- **Pattern:** Matches the existing Total row pattern on line 659.

### 📋 Plan Review
**APPROVED** — Single line change, follows existing pattern, no risk.

### 🔒 Security Review
**CLEAR** — No user input, no external data, no security implications.

### 🧪 Test Plan
- Run `npm run build` to verify no compilation errors.
- Manual check: generate a PDF report and verify the Pillar Performance table shows `%` on weighted scores.

## Relevant Files
- `lib/generatePdf.js` — Contains the Pillar Performance table rendering (line 649)

### New Files
None

## Step by Step Tasks

### Step 1: Append `%` to weighted score in pillar rows
- In `lib/generatePdf.js` line 649, change `(data.score * weight).toFixed(2)` to `(data.score * weight).toFixed(2) + '%'`

## Validation Commands
- `npm run build` — Verify build passes

## Notes
- The Total row (line 659) already uses `twSum.toFixed(2) + '%'` — this change makes all rows consistent.
