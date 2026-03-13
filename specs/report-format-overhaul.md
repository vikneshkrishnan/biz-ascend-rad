# Chore: Overhaul PDF Report to 13-Section Format

## Chore Description
Rewrite the PDF report generator (`lib/generatePdf.js`) and update the AI prompt (`scripts/generate_report.py`) to produce a comprehensive 13-section report matching the user's exact format specification.

## Agent Reports

### Scope Analysis

**What exactly is being asked?**
Transform the current 6-section PDF report into a 13-section format:

| # | Section | Data Source |
|---|---|---|
| Cover | Report Information table | Screener responses |
| 1 | Executive Summary | AI (exists) |
| 2 | Company Input Snapshot | Screener responses (q1-q20) |
| 3 | Growth System Diagnostic Overview (pillar table + narrative) | Scores + AI narrative |
| 4 | Primary Growth Constraint | Scores + AI (new field) |
| 5 | Pillar-by-Pillar Review (working/weak/AI assessment per pillar) | AI (new: structured pillar reviews) |
| 5b | Competitive Positioning Comparison table | AI (new field) |
| 6 | Growth Constraint Map narrative | AI (new field) |
| 7 | RAPS | Scores + AI (exists) |
| 8 | Market Opportunity Context | market_report (exists) |
| 9 | Org & Systems Readiness Summary | Scores |
| 10 | Advisory Workstream Recommendation | AI (new field) |
| 11 | 30-60-90 Day Action Roadmap | AI (exists, restructure) |
| 12 | Priority Actions Summary | AI (new field) |
| 13 | Closing Observation | AI (new field) |

**What is NOT being asked?**
- Not changing the scoring logic
- Not changing the UI scores page

**New AI report fields needed:**
- `primary_constraint_narrative`: 2-3 paragraphs on the primary constraint
- `primary_constraint_flows_into`: array of impact areas
- `pillar_reviews`: object with p1-p9, each containing `working` (array), `weak` (array), `ai_assessment` (string)
- `competitive_comparison`: array of objects with brand + 8 dimension scores
- `competitive_whitespace`: string
- `constraint_map_narrative`: 1-2 paragraphs
- `advisory_workstreams`: array of {priority, workstream, reason}
- `priority_actions`: array of {tier, focus}
- `closing_observation`: 2-3 paragraphs
- `action_roadmap`: object with `days_1_30`, `days_31_60`, `days_61_90` (arrays of strings)

**Acceptance criteria:**
1. PDF generates all 13 sections in order
2. New AI fields are requested in the prompt
3. Fallbacks work when AI fields are missing (backward compat with existing reports)
4. Build passes

### Architecture Decision

**Files to modify:**

| # | File | Action |
|---|---|---|
| 1 | `scripts/generate_report.py` | Update AI prompt to request new fields |
| 2 | `lib/generatePdf.js` | Complete rewrite to 13-section format |

**Strategy:**
- Update Python prompt first (adds new fields, backward compatible since old reports just won't have them)
- Rewrite PDF generator with fallbacks for missing fields
- Each section checks if data exists before rendering

### Plan Review
**Verdict: APPROVED**

### Security Review
**Verdict: CLEAR** — No new inputs, no new dependencies.

### Test Plan
- `npx next build` — Build succeeds
- Manual: generate a report PDF and verify all 13 sections

## Relevant Files
- `scripts/generate_report.py` — AI prompt that generates report data
- `lib/generatePdf.js` — PDF generation function
- `lib/constants.js` — Pillar names, weights, screener fields

## Step by Step Tasks

### Step 1: Update AI prompt in generate_report.py
- Add new fields to the JSON schema in the prompt
- Add fallback defaults for new fields

### Step 2: Rewrite lib/generatePdf.js
- Cover page with Report Information table
- Section 1: Executive Summary
- Section 2: Company Input Snapshot (from screener)
- Section 3: Growth System Diagnostic Overview (pillar table + narrative)
- Section 4: Primary Growth Constraint
- Section 5: Pillar-by-Pillar Review + Competitive Comparison
- Section 6: Growth Constraint Map
- Section 7: RAPS
- Section 8: Market Opportunity Context
- Section 9: Org & Systems Readiness Summary
- Section 10: Advisory Workstream Recommendation
- Section 11: 30-60-90 Day Roadmap
- Section 12: Priority Actions Summary
- Section 13: Closing Observation

### Step 3: Validate
- `npx next build`

## Validation Commands
- `npx next build` — Ensure build succeeds
