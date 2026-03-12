# Chore: Remove Filter Icon from Project Listing Page

## Chore Description
Remove the funnel filter icon next to the "All Pipeline" dropdown on the Projects List page, as shown in the user's screenshot.

## Agent Reports

### 🔍 Scope Analysis
- **What:** Remove the `<Filter>` funnel icon (line 946 of `app/page.js`) that renders next to the "All Pipeline" dropdown. Also remove the `<SlidersHorizontal>` button (lines 960-962) which is the settings-style filter icon on the far right.
- **Not in scope:** The dropdown itself, search input, or filtering logic.
- **Acceptance criteria:** Both filter icons no longer appear. The dropdown still works. App builds.

### 🏗️ Architecture Decision
**1 file to modify:** `app/page.js`
- Remove `<Filter className="w-4 h-4 text-muted-foreground opacity-50" />` (line 946)
- Remove the `<Button>` wrapping `<SlidersHorizontal>` (lines 960-962)
- Remove `Filter` and `SlidersHorizontal` from the lucide-react import (line 13)

### 📋 Plan Review
**APPROVED** — Cosmetic removal, no side effects.

### 🔒 Security Review
**CLEAR**

### 🧪 Test Plan
- `npm run build` — Verify app builds without errors

## Relevant Files
- `app/page.js` — Contains both filter icons to remove

### New Files
None.

## Step by Step Tasks

### Step 1: Remove filter icons and unused imports
- Remove `Filter` and `SlidersHorizontal` from lucide-react import on line 13
- Remove `<Filter>` element on line 946
- Remove `<Button>` with `<SlidersHorizontal>` on lines 960-962

### Step 2: Validate build
- Run `npm run build`

## Validation Commands
- `npm run build` — Verify app builds successfully
