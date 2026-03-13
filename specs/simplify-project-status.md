# Chore: Simplify Project Status to Completed/In Progress

## Chore Description
Remove "draft" and "archived" statuses from projects. Keep only "completed" and "in_progress". Update Supabase DB constraint and migrate existing draft projects to in_progress.

## Agent Reports

### 🔍 Scope Analysis
**What exactly is being asked?** Remove draft/archived status options, keep only completed and in_progress. Update DB constraint and migrate data.

**Assumptions:**
- Existing "draft" projects → "in_progress"
- No "archived" projects exist currently
- New projects should default to "in_progress" instead of "draft"

**Acceptance criteria:** Only "completed" and "in_progress" statuses exist in DB and UI.

### 🏗️ Architecture Decision
**Files:** 2 files + Supabase migration

1. **Supabase DB:** Migrate draft→in_progress, update CHECK constraint
2. **`app/api/[[...path]]/route.js`:** Change default status from 'draft' to 'in_progress', remove draft-specific logic
3. **`app/page.js`:** Remove draft/archived from status badge, filter dropdowns, archive action

### 📋 Plan Review
**APPROVED**

### 🔒 Security Review
**CLEAR**

### 🧪 Test Plan
- Verify no projects have draft/archived status in DB
- Visual check of project list filters and status badges

## Relevant Files
- `app/api/[[...path]]/route.js` — default status on create (line 285), draft check (line 363)
- `app/page.js` — status badge styles (lines 113-122), filter dropdowns (lines 925-928), archive action (line 1093)

## Step by Step Tasks

### Step 1: Migrate DB data and update constraint
- Update all draft projects to in_progress
- Alter CHECK constraint to only allow completed/in_progress

### Step 2: Update API route
- Change default project status from 'draft' to 'in_progress'
- Remove `.eq('status', 'draft')` condition

### Step 3: Update frontend
- Remove draft/archived from status badge styles and labels
- Remove draft/archived filter options
- Remove archive action

## Validation Commands
- `SELECT status, count(*) FROM projects GROUP BY status` — verify only completed/in_progress
