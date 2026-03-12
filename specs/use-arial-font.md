# Chore: Use Arial Font for Entire Application

## Chore Description
Replace the current font stack (Instrument Sans / Instrument Serif loaded via `next/font/google`) with Arial as the primary font across the entire application.

## Agent Reports

### Scope Analysis
- **What:** Replace Google Fonts (Instrument Sans/Serif) with system font Arial across the entire app.
- **Not in scope:** Font sizes, weights, line heights, or other typography settings.
- **Assumptions:** Arial with standard fallbacks (`Arial, Helvetica, sans-serif`). Both sans and serif Tailwind font families will use Arial.
- **Edge cases:** None — Arial is universally available on all platforms.
- **Acceptance criteria:** All text renders in Arial. No Google Font network requests. App builds without errors.

### Architecture Decision
**3 files to modify:**
1. `app/layout.js` — Remove `next/font/google` imports, CSS variable injection, and font variable classes from `<html>`.
2. `tailwind.config.js` — Set `fontFamily.sans` to `['Arial', 'Helvetica', 'sans-serif']`. Remove serif entry.
3. `app/globals.css` — No changes needed.

**Strategy:** Remove Google Font loading entirely. Set Arial directly in Tailwind config. The existing `font-sans` class on `<body>` will automatically apply the new font.

**No new dependencies.** Removes external Google Fonts dependency.

### Plan Review
**APPROVED** — Minimal, complete, and fully reversible.

### Security Review
**CLEAR** — Removes an external network dependency (Google Fonts CDN). No security concerns.

### Test Plan
- `npm run build` — Verify app builds without errors
- Visual inspection in browser — confirm Arial renders correctly
- No existing tests affected by font changes

## Relevant Files
- `app/layout.js` — Root layout where Google Fonts are imported and applied
- `tailwind.config.js` — Font family configuration for Tailwind CSS
- `app/globals.css` — Global CSS (no changes needed, but reviewed for completeness)

### New Files
None.

## Step by Step Tasks

### Step 1: Update Tailwind font configuration (Architect)
- In `tailwind.config.js`, change `fontFamily.sans` from `['var(--font-sans)']` to `['Arial', 'Helvetica', 'sans-serif']`
- Remove `fontFamily.serif` entry (no longer needed)

### Step 2: Simplify root layout (Architect)
- In `app/layout.js`, remove `import { Instrument_Sans, Instrument_Serif } from 'next/font/google'`
- Remove the `instrumentSans` and `instrumentSerif` constant declarations
- Remove font variable classes from `<html>` `className`
- Keep `font-sans antialiased` on `<body>`

### Step 3: Validate build (Test Engineer)
- Run `npm run build` to confirm no build errors

## Validation Commands
- `npm run build` — Verify app builds successfully

## Notes
- Arial is a system font, so no font loading or network requests are needed.
- The `font-sans` Tailwind utility on `<body>` ensures all child elements inherit Arial by default.
