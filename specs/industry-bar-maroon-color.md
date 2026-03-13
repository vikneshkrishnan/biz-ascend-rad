# Chore: Industry Distribution Bar Maroon Color

## Chore Description
Change the Industry Distribution bar chart colors from the current multi-color palette to maroon.

## Agent Reports

### 🔍 Scope Analysis

**What exactly is being asked?**
Change the COLORS array used by the Industry Distribution BarChart so all bars render in maroon.

**What is NOT being asked?**
- No changes to chart structure, data, or functionality
- No changes to other charts or components

**Assumptions:**
- "Maroon" means `#800000` or similar dark red — the app's primary color `hsl(0, 100%, 30%)` = `#990000` is already maroon-like
- All bars should be maroon, using slight shade variations for visual distinction between sectors

**Ambiguities:** Whether all bars should be identical maroon or shaded variants. Using shaded variants for better UX.

**Acceptance criteria:** All Industry Distribution bars render in maroon tones.

### 🏗️ Architecture Decision
**File:** `app/page.js` — change COLORS array at line 521.

**Change:** Replace `['#000000', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b']` with maroon shades `['#800000', '#990000', '#7a1a1a', '#660000', '#8b0000', '#a52a2a']`.

### 📋 Plan Review
**APPROVED**

### 🔒 Security Review
**CLEAR**

### 🧪 Test Plan
- Visual inspection of the Industry Distribution chart on the admin dashboard

## Relevant Files
- `app/page.js` — COLORS array at line 521

### New Files
None

## Step by Step Tasks

### Step 1: Update COLORS array to maroon shades

## Validation Commands
- Visual inspection

## Notes
- The gradient definitions at lines 628-634 use these colors for top-to-bottom gradients, so the bars will have a nice maroon gradient effect.
