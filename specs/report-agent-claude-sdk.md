# Chore: Report Agent using Anthropic Claude SDK

## Chore Description
Replace the Python-based report generation (`scripts/generate_report.py` via subprocess) with a native Node.js report agent using `@anthropic-ai/sdk`. The agent uses Claude's built-in `web_search` tool for market research/crawling and generates the same structured report format.

## Agent Reports

### 🔍 Scope Analysis
- **What exactly is being asked?** Create a Node.js report generation agent using the Anthropic SDK that replaces the current Python subprocess approach. Add web search/crawling capability for market intelligence.
- **What is NOT being asked?** Not changing the report JSON format, not changing the PDF generation, not changing the frontend UI (the same buttons/flows trigger it).
- **Assumptions:**
  - User will provide an `ANTHROPIC_API_KEY` environment variable
  - The Anthropic API `web_search` tool is available on their plan
  - The existing report JSON structure is preserved exactly
- **Edge cases:**
  - API key missing/invalid — need graceful error
  - Web search tool not available on user's plan — fallback to generation without search
  - Long responses exceeding token limits — use max_tokens appropriately
  - JSON parsing failures — keep the same fallback logic from Python script
- **Acceptance criteria:**
  1. Report generation works via the same API endpoint
  2. No Python subprocess needed
  3. Market report uses web search for real crawled data
  4. Same JSON output format as before
  5. Build passes

### 🏗️ Architecture Decision

**New file:** `lib/reportAgent.js`
- `generateDiagnosticReport(data)` — ports Python prompt logic to Node.js using `@anthropic-ai/sdk`
- `generateMarketReport(data)` — uses Claude with `web_search` tool for real market intelligence

**Modified file:** `app/api/[[...path]]/route.js`
- Replace `runPythonScript(scriptData)` calls with direct `reportAgent` function calls
- Remove dependency on `EMERGENT_LLM_KEY`, use `ANTHROPIC_API_KEY` instead

**New dependency:** `@anthropic-ai/sdk`

**Strategy:**
1. The diagnostic report uses the same detailed prompt (ported from Python) with Claude's messages API
2. The market report uses Claude with `web_search` tool type, allowing Claude to research real market data about the target countries/industries
3. Both functions return parsed JSON matching the existing report structure
4. JSON parsing includes the same fallback logic

### 📋 Plan Review
**APPROVED** — Clean replacement of Python subprocess with native Node.js. Same interface, same output format, better integration.

### 🔒 Security Review
**FINDINGS (Medium):**
- `ANTHROPIC_API_KEY` must be server-side only (never exposed to client). The API route runs server-side in Next.js, so this is safe.
- Web search results from Claude are used as-is in report text — low risk since output goes into a PDF, not rendered as HTML.

### 🧪 Test Plan
- `npx next build` — verify build passes
- Manual: trigger report generation via the existing UI flow
- Verify JSON output matches expected structure

## Relevant Files
- `lib/reportAgent.js` — NEW: Report agent using Anthropic SDK
- `app/api/[[...path]]/route.js` — Modified: replace Python subprocess with reportAgent calls
- `scripts/generate_report.py` — Reference only (keeping for fallback, not deleting)

### New Files
- `lib/reportAgent.js`

## Step by Step Tasks

### Step 1: Install @anthropic-ai/sdk
- `npm install @anthropic-ai/sdk` (or yarn add)

### Step 2: Create lib/reportAgent.js
- Port `generate_report()` prompt from Python to Node.js
- Port `generate_market_report()` with web_search tool
- Export both functions
- Include JSON parsing with fallback logic

### Step 3: Update API route
- Import reportAgent functions
- Replace `runPythonScript(scriptData)` with `generateDiagnosticReport(data)`
- Replace `runPythonScript(marketData)` with `generateMarketReport(data)`
- Use `ANTHROPIC_API_KEY` env var

### Step 4: Validate
- `npx next build`

## Validation Commands
- `npx next build`

## Notes
- The Python script is kept as fallback but no longer called
- `ANTHROPIC_API_KEY` must be added to `.env.local` and Vercel env vars
- Web search tool uses `web_search_20250305` type in Anthropic API
