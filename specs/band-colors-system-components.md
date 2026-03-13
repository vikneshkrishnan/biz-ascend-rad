# Chore: Apply scoring band colors to System Components

## Chore Description
Update the System Components section on the scores page to use the same 4-band color coding as the overall maturity band: Green (>=80), Lime/Yellow-Green (65-79), Dark Orange (50-64), Red (<50). Currently uses a 3-color traffic light based on avg question score (1-5 scale).

## Agent Reports

### Scope Analysis
**What exactly is being asked?** Replace the `trafficLight(data.avg)` color logic (3-tier, based on 1-5 avg) with a 4-tier color logic based on the pillar's percentage score (0-100), matching the overall band colors:
- `>= 80` → `bg-emerald-500` (Green)
- `>= 65` → `bg-lime-500` (Yellow-Green)
- `>= 50` → `bg-orange-600` (Dark Orange)
- `< 50` → `bg-rose-500` (Red)

**What is NOT being asked?** Not changing the overall maturity band display, radar chart, or any other section.

**Acceptance criteria:**
1. Each pillar's dot indicator and progress bar in System Components uses the 4-band color based on `data.score` (0-100)
2. Colors match the overall band: emerald/lime/orange/rose
3. Build passes

### Architecture Decision
**File:** `components/scores/ScoresPage.js`
**Change:** Replace the `trafficLight` function to use percentage-based 4-band scoring on `data.score` instead of `data.avg`.

### Plan Review
**Verdict: APPROVED** — Single function change in one file.

### Security Review
**Verdict: CLEAR**

### Test Plan
**Validation:** `npx next build`

## Relevant Files
- `components/scores/ScoresPage.js` — Contains `trafficLight` function and System Components rendering

## Step by Step Tasks

### Step 1: Update trafficLight function
- Change from 3-tier avg-based to 4-tier score-based matching band colors

### Step 2: Update usage sites to pass `data.score` instead of `data.avg`

### Step 3: Validate
- `npx next build`
