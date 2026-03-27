# Report Generation System — Complete Reference

> **Generated**: 2026-03-21
> **Purpose**: Comprehensive reference for all report generation logic, data flows, and code locations. Use this document when implementing changes to scoring, AI reports, PDF generation, or related features.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Scoring Engine](#2-scoring-engine)
3. [AI Report Generation](#3-ai-report-generation)
4. [PDF Generation](#4-pdf-generation)
5. [API Routes](#5-api-routes)
6. [Client-Side Display](#6-client-side-display)
7. [RAPS Calculation](#7-raps-calculation)
8. [Data Shapes](#8-data-shapes)
9. [File Reference Map](#9-file-reference-map)

---

## 1. Architecture Overview

### End-to-End Flow

```
Diagnostic Submit → calculateScores() → scores stored in DB
                                            ↓
                        "Generate Report" button click
                                            ↓
                    GET /projects/:id/report (check cache)
                         ↓ (miss)           ↓ (hit)
              POST /projects/:id/report/generate    → return cached
                         ↓
              Promise.all([
                generateDiagnosticReport()  →  Claude API (no tools, 16K tokens)
                generateMarketReport()      →  Claude API (web_search tool, 8K tokens)
              ])
                         ↓
              Merge into fullReport, save to DB
                         ↓
              generateClientPdf() — client-side jsPDF
                         ↓
              PDF downloaded to browser
```

### Key Design Decisions
- **Scores are cached** in `assessments.scores` (JSONB) — recalculated only if missing
- **Reports are cached** in `assessments.report_data` (JSONB) — regenerated only on explicit request
- **PDF is client-side** via jsPDF — no server-side PDF generation in production (Python scripts are legacy/unused)
- **Diagnostic + Market reports run in parallel** via `Promise.all`; market report failure is silently caught
- **No streaming** — both Claude API calls use blocking `messages.create()`

---

## 2. Scoring Engine

### File: `app/api/[[...path]]/route.js` — `calculateScores()` (lines 134–210)

**Signature**: `calculateScores(diagnosticResponses, screenerResponses, customWeights = null)`

### Per-Pillar Score Formula

```
For each pillar (p1–p9):
  1. Filter diagnostic responses matching pillarId prefix (e.g., p1_q1, p1_q2...)
  2. Only include numeric values (skip qualitative text responses)
  3. avg = sum(values) / count
  4. score = round((avg / 5) * 100, 1 decimal)  →  0–100 scale
  5. weightedContribution = score × pillarWeight
```

### RAD Score (Weighted Total)

```
radScore = round(sum(pillarScore × pillarWeight for all pillars), 1 decimal)
```

### Pillar Weights (from `lib/constants.js` lines 233–235)

| Pillar | Weight | Name |
|--------|--------|------|
| p1 | 0.12 | Commercial Baseline |
| p2 | 0.11 | ICP & Buyer Urgency |
| p3 | 0.15 | Positioning & Competitive Clarity |
| p4 | 0.15 | Sales System Repeatability |
| p5 | 0.10 | Pipeline Generation |
| p6 | 0.07 | Revenue Economics |
| p7 | 0.08 | Strategic Constraints |
| p8 | 0.10 | Organisational Alignment & Capability |
| p9 | 0.12 | Systems Readiness & AI Transformation |

**Sum = 1.00**

### Maturity Bands

| Range | Band | Color Key |
|-------|------|-----------|
| >= 80 | Growth Engine Strong | `band-strong` / green (40,167,69) |
| 65–79 | Growth System Constrained | `band-constrained` / lime (50,205,50) |
| 50–64 | Growth System Underpowered | `band-underpowered` / orange (255,140,0) |
| 0–49 | Growth System At Risk | `band-risk` / red (220,53,69) |

Defined in 3 places (must stay in sync):
- `lib/constants.js:218–223` — `MATURITY_BANDS` array
- `lib/utils.js:8–13` — `getMaturityBand()` function
- `lib/generatePdf.js:38–43` — `getBandName()` function

### Constraint Detection (lines 158–165)

All pillars with `score > 0 AND score < 65` are "constrained". Sorted ascending (worst first). Each gets:
```js
{ id, name, score, rank (1-based), category }
```

Constraint category map:
```
p1 → commercial_foundation     p2 → market_targeting
p3 → positioning_weakness      p4 → sales_system
p5 → pipeline_constraint       p6 → revenue_economics
p7 → strategic_constraint      p8 → organizational_alignment
p9 → systems_readiness
```

### Growth Leak Detection (lines 167–174)

Individual questions scoring 1 or 2 (on 1–5 scale). Returns:
```js
{ questionId, score, pillar, pillarName }
```

### Where `calculateScores` Is Called

| Location | Trigger |
|----------|---------|
| `POST /projects/:id/diagnostic/submit` (line 519) | Consultant submits diagnostic |
| `POST /assess/:token/submit` (line 685) | Public questionnaire submission |
| `GET /projects/:id/scores` (line 549) | Score fetch (if not cached) |
| `POST /projects/:id/report/generate` (line 855) | Report generation (if scores not cached) |
| `POST /admin/recalculate-scores/:id` (line 776) | Admin forced recalculation |

---

## 3. AI Report Generation

### File: `lib/reportAgent.js` (312 lines)

### Function 1: `generateDiagnosticReport(data)` (lines 24–230)

**Input**: `{ scores, screener_responses, diagnostic_responses, project_id }`

**Claude API Parameters**:
- Model: `claude-sonnet-4-20250514`
- Max tokens: 16,384
- No tools (no web search)
- System: "You are a senior B2B revenue growth diagnostic expert..."

**Data Extraction from Input**:

| Variable | Source | Purpose |
|----------|--------|---------|
| `company` | `screener.q4` | Company name |
| `industry` | `screener.q5` | Industry sector |
| `pillarScores` | `scores.pillarScores` | All pillar scores |
| `radScore` | `scores.radScore` | Overall RAD score |
| `maturity` | `scores.maturityBand` | Band label |
| `constraint` | `scores.primaryConstraint` | Lowest pillar |
| `raps` | `scores.raps` | Full RAPS object |

**Qualitative Responses Extracted (lines 43–50)**:

| Variable | Key | Question |
|----------|-----|----------|
| `qualitativeP3` | `diagnostic.p3_q12` | Positioning challenge |
| `qualitativeP3b` | `diagnostic.p3_q13` | Differentiated value vs customers |
| `qualitativeP7` | `diagnostic.p7_q6` | Strategic constraint |
| `qualitativeP8` | `diagnostic.p8_q13` | People/alignment/execution issue |
| `qualitativeP9` | `diagnostic.p9_q13` | Systems/data/AI-readiness issue |

**Screener Fields Used in Prompt (q4–q19)**:

| Key | Field |
|-----|-------|
| q4 | Company name |
| q5 | Industry |
| q6 | Markets |
| q7 | Revenue range |
| q8 | Sales staff |
| q9 | Marketing budget |
| q10 | Sales model |
| q11 | GTM channels |
| q12 | Positioning statement |
| q13 | Competitors |
| q14 | Deal size |
| q15 | Sales cycle |
| q16 | Open pipeline |
| q17 | Win rate |
| q18 | Revenue target |
| q19 | Revenue invoiced |

**Prompt Structure** (lines 58–202):
1. COMPANY DATA block — all screener fields
2. SCORES block — RAD score, maturity band, primary constraint
3. PILLAR SCORES block — bullet list of all 9 pillar scores
4. QUALITATIVE RESPONSES block — all 5 qualitative answers
5. RAPS DATA block — full RAPS metrics (score, label, revenue remaining, monthly required, months remaining, pipeline, expected convertible, coverage ratio/rating, win rate, base probability, RAD modifier)
6. JSON SCHEMA instruction — rigid output schema with 15+ top-level keys

**Retry Logic**: If first JSON parse fails, retries once by appending correction message to conversation.

### Function 2: `generateMarketReport(data)` (lines 232–311)

**Input**: `{ markets, industry, company, project_id }`

**Claude API Parameters**:
- Model: `claude-sonnet-4-20250514`
- Max tokens: 8,192
- Tool: `web_search_20250305` (max 10 uses)
- System: "You are a market research analyst..."

**Logic**:
1. Normalize markets (comma-split, max 3 countries)
2. Call Claude with web search enabled
3. If web search unavailable → fallback call without tools
4. Parse JSON response (no retry on failure — caught upstream)

**Output**: `{ countries: [{ name, dimensions[5], growth_propensity, key_drivers, risks, strategic_implications }] }`

**5 Dimensions per Country**:
1. Economic Environment
2. Political & Regulatory
3. Geopolitical Factors
4. Socio-economic Trends
5. Industry Growth Outlook

### Parallelization (route.js lines 860–869)

```js
const [reportData, marketReport] = await Promise.all([
  generateDiagnosticReport(reportInput),
  generateMarketReport({ ... }).catch(e => ({ countries: [] })),  // silent failure
])
const fullReport = { ...reportData, market_report: marketReport, generated_at: ISO }
```

### Helper: `parseJsonResponse(text)` (lines 10–22)

Strips markdown fences and artifacts before `JSON.parse`. Handles:
- Triple backtick code blocks
- `json` prefix after fence
- Whitespace trimming

---

## 4. PDF Generation

### File: `lib/generatePdf.js` (1164 lines)

**Function**: `generateClientPdf({ scores, report, project, screenerResponses, thresholds })`

**Runs client-side** using jsPDF. Returns filename string.

### PDF Sections (13 sections + cover + disclaimer)

| # | Section | Lines | Key Data Source |
|---|---------|-------|-----------------|
| Cover | Cover Page | 465–544 | Logo, company, radScore, maturityBand |
| TOC | Table of Contents | 546–582 | Static numbered list |
| 1 | Executive Summary | 584–606 | `report.executive_summary`, radar chart from `pillarScores` |
| 2 | Company Input Snapshot | 608–643 | `screenerResponses` (q1–q20) |
| 3 | Growth System Diagnostic Overview | 645–692 | Pillar table with weights + scores, heatmap bar chart |
| 4 | Primary Growth Constraint | 694–737 | Pillars with score < 50, `report.pillar_narratives` |
| 5 | Pillar-by-Pillar Review | 742–820 | All 9 pillar narratives, positioning assessment, moat score |
| 6 | Growth Constraint Map | 822–837 | All pillars sorted by score (bar chart) |
| 7 | RAPS | 839–949 | Gauge chart, RAPS inputs table, narrative, why/improve factors |
| 8 | Market Opportunity Context | 951–977 | `report.market_report.countries[]` |
| 9 | Org & Systems Readiness | 979–1001 | P8 + P9 scores with interpretive text |
| 10 | Advisory Workstream | 1003–1020 | 3 lowest-scoring pillars |
| 11 | 30-60-90 Day Action Roadmap | 1022–1076 | `report.action_plan` (3 phases) |
| 12 | Priority Actions Summary | 1078–1098 | Algorithmic: fix first/next/stabilise/protect |
| 13 | Closing Observation | 1100–1115 | Last paragraph of executive_summary |
| End | Disclaimer | 1117–1163 | Logo, legal text, generation date |

### Color Constants (lines 4–18)

```js
COLORS = {
  primary: [185, 28, 28],    // deep red
  accent: [249, 115, 22],    // orange
  green: [40, 167, 69],
  yellow: [50, 205, 50],     // lime green
  orange: [255, 140, 0],
  red/rose: [220, 53, 69],
  // + dark, medium, light, white, bg, border
}
```

### Band Color Logic in PDF (lines 24–43)

Same thresholds as scoring (80/65/50) but overridable via `thresholds` parameter:
- `getBandColor(score)` → RGB array
- `getBandLabel(score)` → 'Green'/'Lime Green'/'Dark Orange'/'Red'
- `getBandName(score)` → maturity band string

### Chart Drawing Functions

| Function | Lines | Description |
|----------|-------|-------------|
| `drawRadarChart()` | 221–317 | Spider chart with pentagon grid, data polygon, colored fill |
| `drawHBarChart()` | 320–354 | Horizontal bars with band colors |
| `drawGauge()` | 357–420 | Semicircle gauge with needle (used for RAPS) |
| `drawTable()` | 173–216 | Data table with header + colored status dots |
| `drawInfoTable()` | 423–462 | Key-value pair table |

### Priority Actions Algorithm (Section 12, lines 1078–1098)

Derived from pillar scores (sorted ascending):
- **Fix First**: pillars with score < 50
- **Fix Next**: 2nd + 3rd lowest pillars
- **Stabilise**: 4th + 5th lowest pillars
- **Protect**: 2 highest-scoring pillars

---

## 5. API Routes — Report-Related

### File: `app/api/[[...path]]/route.js`

| Route | Method | Lines | Auth | Purpose |
|-------|--------|-------|------|---------|
| `/projects/:id/scores` | GET | 534–558 | Yes | Get/calculate scores |
| `/projects/:id/scores/compare` | GET | — | Yes | Compare scores across assessments |
| `/projects/:id/report/generate` | POST | 842–880 | Yes | Trigger AI report generation |
| `/projects/:id/report` | GET | 882–891 | Yes | Fetch cached report |
| `/projects/:id/report/pdf` | GET | 893–916 | Yes | Generate PDF via Python (legacy) |
| `/notifications/send-report` | POST | 918–962 | Yes | Email report link |
| `/notifications/send-pdf-report` | POST | 993–1054 | Yes | Email PDF attachment |
| `/admin/recalculate-scores/:id` | POST | 776–792 | Admin | Force score recalculation |

### Report Generation Route Detail (POST `/projects/:id/report/generate`)

1. Auth check
2. Load latest assessment → validate `diagnostic_status === 'completed'`
3. Build `reportInput` with scores (cached or recalculated), screener, diagnostic
4. `Promise.all([generateDiagnosticReport, generateMarketReport])` — parallel
5. Merge: `{ ...diagnosticReport, market_report: marketReport, generated_at }`
6. Save to `assessments.report_data` + `report_generated_at`
7. Log activity
8. Return full report JSON

### DB Tables Involved

| Table | Read Fields | Write Fields |
|-------|-------------|--------------|
| `assessments` | scores, diagnostic_responses, screener_responses, report_data, diagnostic_status | scores, report_data, report_generated_at |
| `projects` | company_name | status (on submit routes) |
| `activity_log` | — | action entries |
| `platform_settings` | pillar_weights (admin recalc only) | — |

---

## 6. Client-Side Display

### File: `app/page.js` — ScoresPage Component (lines 2264–2526)

**Data Fetching**:
- `useQuery(['scores', id])` → `GET /api/projects/:id/scores`
- `useQuery(['project', id])` → `GET /api/projects/:id`

**"Generate Report" Button Handler** (`downloadPdf`, lines 2272–2295):
```
1. GET /api/projects/:id/report  (try cached)
2. If miss → POST /api/projects/:id/report/generate  (trigger AI)
3. Call generateClientPdf({ scores, report, project, screenerResponses })
4. PDF auto-downloads via jsPDF doc.save()
```

**UI Layout**:
- Left panel: RAD score (8xl number), maturity band badge, constraint list
- Right panel: Recharts RadarChart (all 9 pillars)
- Pillar scores list: colored dots, progress bars, constraint highlighting
- RAPS card: score, confidence label, revenue target/invoiced

**Band Color CSS Classes**:
```
bg-band-strong, bg-band-constrained, bg-band-underpowered, bg-band-risk
```

---

## 7. RAPS Calculation

### File: `lib/rapsCalculation.js` (228 lines)

### `calculateRAPS(inputs)` (lines 96–193)

**Inputs** (all with defaults):
```js
{ target=0, invoiced=0, fyEndMonth=12, openPipeline=0, winRate=0.2, salesCycle=3, radScore=50 }
```

### Step-by-Step Formula

```
Step 1: revenueRemaining = max(0, target - invoiced)
Step 2: monthsRemaining = calendar months to fyEndMonth (min 1)
Step 3: requiredMonthlyRevenue = revenueRemaining / monthsRemaining

Step 4: Time-to-Close Factor (ratio = salesCycle / monthsRemaining)
  ratio < 0.5  → timeFactor = 1.0
  ratio < 1.0  → timeFactor = 0.7
  ratio < 1.5  → timeFactor = 0.4
  ratio >= 1.5 → timeFactor = 0.2

Step 5: expectedConvertible = openPipeline × winRate × timeFactor

Step 6: coverageRatio = expectedConvertible / revenueRemaining
  (999 if target already met)

Step 7: Coverage Rating
  > 1.2  → Strong    ≥ 0.9 → Moderate    ≥ 0.6 → Weak    < 0.6 → Very Weak

Step 8: Base Probability
  > 1.2  → 75    ≥ 0.9 → 60    ≥ 0.6 → 40    < 0.6 → 20

Step 9: RAD Modifier (additive to base probability)
  radScore ≥ 80 → +10    ≥ 65 → +5    ≥ 50 → 0    ≥ 35 → -10    < 35 → -20

Step 10: RAPS Score = clamp(0, 100, baseProbability + radModifier)

Step 11: Label
  ≥ 75 → High    ≥ 50 → Moderate    ≥ 25 → Low    < 25 → Very Low
```

### `calculateRAPSImprovement(current, improvements)` (lines 204–227)

Runs `calculateRAPS` twice (current inputs, then with improvements merged). Returns:
```js
{ current: { score, label, ... }, improved: { score, label, ..., assumptions }, delta }
```

Standard improvement scenario (set in route.js):
- Win rate: +5 percentage points (capped at 1.0)
- Open pipeline: +25%

### Parser Utilities

| Function | Lines | Purpose |
|----------|-------|---------|
| `parseCurrency(val)` | 61–65 | Strip $,commas → float |
| `parseWinRate(val)` | 70–73 | String lookup or number conversion |
| `parseSalesCycle(val)` | 78–81 | String lookup or pass-through |
| `estimatePipelineFromLegacy(q16, target)` | 51–56 | Legacy categorical → dollar estimate |

### Lookup Tables

**CYCLE_MAP**: `<1 month`→0.5, `1–3 months`→2, `3–6 months`→4.5, `6–12 months`→9, `12+ months`→15

**WIN_RATE_MAP**: `<10%`→0.05, `10–20%`→0.15, `20–30%`→0.25, `30–40%`→0.35, `40%+`→0.45

---

## 8. Data Shapes

### Scores Object (output of `calculateScores`)

```js
{
  radScore: 62.5,                    // 0–100, 1 decimal
  maturityBand: "Growth System Underpowered",
  primaryConstraint: { id: "p3", score: 38.6, name: "Positioning & Competitive Clarity" },
  constraints: [                      // all pillars < 65, sorted ascending
    { id: "p3", name: "...", score: 38.6, rank: 1, category: "positioning_weakness" },
    ...
  ],
  growthLeaks: [                      // individual questions scoring 1 or 2
    { questionId: "p3_q2", score: 1, pillar: "p3", pillarName: "..." },
    ...
  ],
  pillarScores: {
    p1: { score: 68.6, avg: 3.43, count: 7 },
    p2: { score: 45.7, avg: 2.29, count: 7 },
    // ... p3–p9
  },
  raps: { score: 45, label: "Low", ... },           // or null
  rapsImprovement: { current: {...}, improved: {...}, delta: 15 }  // or null
}
```

### Full Report Object (stored in `assessments.report_data`)

```js
{
  // From generateDiagnosticReport (spread at top level):
  executive_summary: "string",
  pillar_narratives: { p1: "string", ..., p9: "string" },
  positioning_assessment: "string",
  strategic_moat_score: 6,           // 1–10
  strategic_moat_narrative: "string",
  raps_narrative: "string",
  raps_why_factors: ["string", ...],
  raps_must_improve: ["string", ...],
  raps_improvement_scenario: {
    current: { score: 45, label: "Low" },
    improved: { score: 60, label: "Moderate", assumptions: "string" }
  },
  action_plan: {
    phase1_title: "string",
    phase1_items: [{ action: "string", pillar: "p4", constraint_category: "sales_system", priority: "critical" }],
    phase2_title: "string",
    phase2_items: [...],
    phase3_title: "string",
    phase3_items: [...]
  },
  company_snapshot: {
    company, industry, revenue_range, sales_staff, sales_model, markets, deal_size, sales_cycle
  },
  growth_constraint_map: {
    primary_constraint: "string",
    causal_chain: ["string", ...],
    downstream_impacts: ["string", ...]
  },
  org_systems_readiness: "string",
  advisory_workstream: {
    recommended_engagement: "string",
    focus_areas: ["string", ...],
    expected_outcomes: ["string", ...]
  },
  priority_actions_summary: {
    fix_first: ["string", ...],
    fix_next: ["string", ...],
    stabilise: ["string", ...],
    protect: ["string", ...]
  },
  competitive_clarity: {
    dimensions: {
      clarity: 7, specificity: 5, buyer_relevance: 6, differentiation: 4,
      memorability: 5, proof_tension: 3, category_ownership: 4, commercial_sharpness: 6
    },
    overall_score: 5,
    positioning_rewrite: "string",
    white_space_insight: "string"
  },
  revenue_waterfall: {
    target: 10000000, invoiced: 6500000, remaining: 3500000,
    pipeline: 5000000, expected_convertible: 1750000, gap: 1750000
  },

  // From generateMarketReport (nested):
  market_report: {
    countries: [{
      name: "Australia",
      dimensions: [{ name: "Economic Environment", findings: ["...", "..."] }, ...],
      growth_propensity: "Medium-High",
      key_drivers: "string",
      risks: "string",
      strategic_implications: "string"
    }]
  },

  generated_at: "2026-03-21T10:00:00.000Z"
}
```

### Assessment DB Row (relevant columns)

```sql
assessments:
  id UUID PK
  project_id UUID FK
  assessment_number INTEGER
  screener_status TEXT ('not_started'|'in_progress'|'completed')
  diagnostic_status TEXT ('not_started'|'in_progress'|'completed')
  screener_responses JSONB   -- { q1: "John", q2: "CEO/Founder", ..., q20: "12" }
  diagnostic_responses JSONB -- { p1_q1: 3, p1_q2: 4, ..., p3_q12: "text", p3_q13: "text", ... }
  scores JSONB               -- full calculateScores() output
  report_data JSONB          -- full merged report (diagnostic + market + generated_at)
  report_generated_at TIMESTAMPTZ
  completed_at TIMESTAMPTZ
```

---

## 9. File Reference Map

| File | Lines | Purpose | Key Exports/Functions |
|------|-------|---------|----------------------|
| `app/api/[[...path]]/route.js` | 1069 | All API endpoints | `calculateScores()`, route handlers |
| `lib/reportAgent.js` | 312 | AI report generation | `generateDiagnosticReport()`, `generateMarketReport()` |
| `lib/rapsCalculation.js` | 228 | RAPS scoring | `calculateRAPS()`, `calculateRAPSImprovement()`, parsers |
| `lib/generatePdf.js` | 1164 | Client-side PDF | `generateClientPdf()` |
| `lib/constants.js` | 236 | Questions, weights, bands | `DIAGNOSTIC_PILLARS`, `PILLAR_WEIGHTS`, `PILLAR_NAMES`, `MATURITY_BANDS` |
| `lib/utils.js` | 13 | Utilities | `getMaturityBand()`, `cn()` |
| `lib/mockData.js` | 480 | Demo mode data | `DEMO_PROJECTS`, `demoApiFetch()` |
| `app/page.js` | 2838 | All UI pages | `ScoresPage` component (lines 2264–2526) |

### Hardcoded Question ID References

These files reference specific question IDs and must be updated when question IDs change:

| File | Lines | Question IDs |
|------|-------|-------------|
| `lib/reportAgent.js` | 43–50 | p3_q12, p3_q13, p7_q6, p8_q13, p9_q13 |
| `lib/mockData.js` | 90–98 | All pillar question IDs |
| `scripts/generate_report.py` | 40–43 | p3_q12, p7_q6, p8_q13, p9_q13 (legacy) |

---

*Reference document for report generation system. Update when implementation changes.*
