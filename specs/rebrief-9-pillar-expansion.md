# Chore: 9-Pillar Expansion & Rebrief Implementation

## Chore Description
Expand the diagnostic from 7 pillars to 9 pillars (adding Pillar 8: Organisational Alignment & Capability, Pillar 9: Systems Readiness & AI Transformation), update all pillar weights, update maturity bands, and ensure all scoring, mock data, report generation, and UI components reflect the new 9-pillar model.

## Gap Analysis: Current vs Required

### 1. Pillars
| Item | Current | Required | Status |
|------|---------|----------|--------|
| Total Pillars | 7 (p1-p7) | 9 (p1-p9) | NEEDS CHANGE |
| P8 Organisational Alignment & Capability | Missing | 12 scored + 1 qualitative | NEW |
| P9 Systems Readiness & AI Transformation | Missing | 12 scored + 1 qualitative | NEW |
| Total Scored Questions | 52 | 76 | NEEDS CHANGE |
| Total Qualitative Questions | 2 | 4 | NEEDS CHANGE |
| Total Questions | 54 | 80 | NEEDS CHANGE |

### 2. Weights
| Pillar | Current Weight | Required Weight | Status |
|--------|---------------|----------------|--------|
| P1 Commercial Baseline | 0.15 | 0.12 | NEEDS CHANGE |
| P2 ICP & Buyer Urgency | 0.15 | 0.11 | NEEDS CHANGE |
| P3 Positioning & Competitive Clarity | 0.15 | 0.15 | OK |
| P4 Sales System Repeatability | 0.15 | 0.15 | OK |
| P5 Pipeline Generation | 0.15 | 0.10 | NEEDS CHANGE |
| P6 Revenue Economics | 0.15 | 0.07 | NEEDS CHANGE |
| P7 Strategic Constraints | 0.10 | 0.08 | NEEDS CHANGE |
| P8 Organisational Alignment | N/A | 0.10 | NEW |
| P9 Systems Readiness & AI | N/A | 0.12 | NEW |

### 3. Maturity Bands
| Score Range | Current Band | Required Band | Status |
|-------------|-------------|---------------|--------|
| 80-100 | Growth Engine Strong (green) | Growth Engine Strong (green) | OK |
| 65-79 | Growth System Developing (amber) | Growth System Constrained (lime) | NEEDS CHANGE |
| 50-64 | (part of Developing / Fragile) | Growth System Underpowered (amber) | NEEDS CHANGE |
| 40-49 | Growth System Fragile (zinc) | Growth System At Risk (red) | NEEDS CHANGE |
| 0-39 | Growth System At Risk (red) | Growth System At Risk (red) | merged into <50 |

### 4. Pillar Names
| Pillar | Current Name | Required Name | Status |
|--------|-------------|---------------|--------|
| P6 | Revenue Economics | Revconomics | NEEDS CHANGE (per rebrief section 2) |
| P8 | N/A | Organisational Alignment & Capability | NEW |
| P9 | N/A | Systems Readiness & AI Transformation | NEW |

### 5. Files Requiring Changes

| File | Change Type | Impact |
|------|------------|--------|
| `lib/constants.js` | Add p8/p9 to DIAGNOSTIC_PILLARS, update weights, update PILLAR_NAMES, update MATURITY_BANDS | CRITICAL |
| `lib/mockData.js` | Add p8/p9 mock responses/scores, update demo report narratives | HIGH |
| `app/api/[[...path]]/route.js` | Update pillarWeights, pillarNames, maturity band thresholds in calculateScores() | CRITICAL |
| `scripts/generate_report.py` | Add p8/p9 to PILLAR_NAMES, update prompt for p8/p9 narratives and qualitative responses | HIGH |
| `scripts/generate_pdf.py` | Add p8/p9 to PILLAR_NAMES | MEDIUM |
| `components/scores/ScoresPage.js` | Auto-scales via PILLAR_NAMES — update maturity band color logic | LOW |

### 6. Items Already Implemented (No Change Needed)
- P1-P5 question content (unchanged)
- P7 question content (unchanged)
- Screener questions (unchanged)
- RAPS calculation logic (unchanged)
- Radar chart, pillar breakdown UI (dynamically iterates — auto-scales)
- PDF pillar row generation (dynamically iterates — auto-scales)

## Agent Reports

### Scope Analysis
- **What exactly is being asked?** Add 2 new diagnostic pillars (p8, p9) with their full question sets, update all 9 pillar weights, update 4-band maturity scoring thresholds, rename P6, and update all data/scoring/reporting layers.
- **What is NOT being asked?** No UI layout redesign. No screener changes. No RAPS formula changes. The sample report content (NexaGrid) does NOT need to replace existing demo data — it serves as a reference for the report structure.
- **Assumptions:** The Likert scale (Strongly disagree=1 to Strongly agree=5) maps to scores 1-5 same as existing pillars. P6 rename to "Revconomics" is intentional per rebrief section 2.
- **Edge cases:** Existing completed assessments with 7 pillars will show p8/p9 as score 0 if not answered. Mock data must include p8/p9 responses for demo to work.
- **Acceptance criteria:** All 9 pillars appear in diagnostic, scores calculate correctly with new weights, maturity bands use new thresholds, AI report includes p8/p9 narratives.

### Architecture Decision
Modify 6 files. No new files needed (except this spec). No new dependencies. Changes are purely additive to existing data structures — all UI components iterate dynamically.

### Plan Review
**APPROVED** — Minimal, complete, correct dependency order.

### Security Review
**CLEAR** — No security implications. Changes are purely data/configuration.

### Test Plan
- Manual: Complete a diagnostic in demo mode, verify all 9 pillars appear
- Manual: Verify scores calculate correctly with new weights
- Manual: Verify maturity bands use new thresholds and labels
- Verify `npm run build` succeeds

## Step by Step Tasks

### Step 1: Update `lib/constants.js` — Core Configuration (Foundational)
- Rename P6 from "Revenue Economics" to "Revconomics"
- Update weights for p1 (0.12), p2 (0.11), p5 (0.10), p6 (0.07), p7 (0.08)
- Add P8 pillar definition with 12 scored questions + 1 qualitative
- Add P9 pillar definition with 12 scored questions + 1 qualitative
- Update MATURITY_BANDS: 80-100 Strong (green), 65-79 Constrained (lime), 50-64 Underpowered (amber), 0-49 At Risk (red)
- Update PILLAR_NAMES with p8, p9, and renamed p6

### Step 2: Update `app/api/[[...path]]/route.js` — Scoring Engine
- Update pillarWeights object in calculateScores()
- Update pillarNames object in calculateScores()
- Update maturity band thresholds to match new bands

### Step 3: Update `lib/mockData.js` — Mock/Demo Data
- Add p8_q1 through p8_q13 and p9_q1 through p9_q13 to diagnostic_responses
- Add p8 and p9 entries to all SCORES objects (SCORES_ACME, SCORES_NOVA, etc.)
- Add p8 and p9 pillar_narratives to DEMO_REPORT
- Recalculate radScore values to reflect new weights

### Step 4: Update `scripts/generate_report.py` — AI Report Generation
- Add p8, p9 to PILLAR_NAMES dict
- Rename p6
- Add qualitative response extraction for p8_q13 and p9_q13
- Update prompt template to include p8 and p9 in pillar_narratives JSON structure

### Step 5: Update `scripts/generate_pdf.py` — PDF Generation
- Add p8, p9 to PILLAR_NAMES dict
- Rename p6

### Step 6: Update maturity band color references in ScoresPage.js
- Update bandColor logic to handle new band names (Constrained, Underpowered)

## Validation Commands
- `npm run build` — Verify no build errors
- Manual: Launch app, navigate to diagnostic, verify 9 pillars visible
- Manual: Check scores page for correct pillar display

## Notes
- The rebrief includes a full NexaGrid sample report. This serves as a reference for report structure, not as replacement demo data. Existing demo data (Acme, Nova, etc.) is updated to include p8/p9 scores.
- P6 rename to "Revconomics" follows rebrief section 2 explicitly.
- All new P8/P9 questions use Likert scale (Strongly disagree → Strongly agree) mapped to 1-5.
