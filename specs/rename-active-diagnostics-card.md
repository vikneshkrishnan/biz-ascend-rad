# Chore: Rename Active Diagnostics to Incomplete Assessments

## Chore Description
Rename the "Active Diagnostics" dashboard stat card label to "Incomplete Assessments" for the admin view.

## Agent Reports

### 🔍 Scope Analysis
**What exactly is being asked?** Change the label text from "Active Diagnostics" to "Incomplete Assessments" on the admin dashboard stat card.

**What is NOT being asked?** No changes to the data source, value, icon, or styling. No changes to non-admin stat cards.

**Assumptions:** Only the label text changes. The underlying stat value (`stats?.active_diagnostics`) remains the same.

**Acceptance criteria:** Admin dashboard shows "Incomplete Assessments" instead of "Active Diagnostics".

### 🏗️ Architecture Decision
**File:** `app/page.js` — line 510, change label string.

### 📋 Plan Review
**APPROVED**

### 🔒 Security Review
**CLEAR**

### 🧪 Test Plan
- Visual inspection of admin dashboard

## Relevant Files
- `app/page.js` — stat card definition at line 510

### New Files
None

## Step by Step Tasks
### Step 1: Rename label from 'Active Diagnostics' to 'Incomplete Assessments'

## Validation Commands
- Visual inspection
