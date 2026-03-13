# Chore: Delete Project

## Chore Description
Add a delete option for projects where admins can permanently delete a project. The delete button should appear on the project detail page alongside the existing archive button, with a confirmation dialog to prevent accidental deletion.

## Agent Reports

### 🔍 Scope Analysis

**What exactly is being asked?**
Add a UI-accessible delete feature for projects, restricted to admin users. The backend DELETE endpoint already exists at `DELETE /api/projects/:id` (hard delete with cascade). The frontend needs a delete button and confirmation dialog.

**What is NOT being asked?**
- No changes to the API endpoint (already exists and works)
- No soft-delete / undo functionality
- No bulk delete
- No consultant-level delete access

**Assumptions:**
- Delete means permanent hard delete (the existing API behavior)
- Only admins can delete (matches existing API authorization)
- The delete button should be on the project detail page (consistent with existing archive button placement)
- Cascading deletes of assessments and questionnaire_links are acceptable (already configured in DB schema)

**Edge Cases:**
- Deleting a project that has an active questionnaire link (link becomes invalid — acceptable)
- Deleting a project while a report is generating (unlikely, but delete should still work)
- Demo mode needs to handle DELETE requests

**Acceptance Criteria:**
1. Admin users see a "Delete" button on the project detail page
2. Clicking delete shows a confirmation dialog with clear warning about permanence
3. Confirming delete removes the project and navigates to the projects list
4. Non-admin users do not see the delete button
5. Demo mode handles delete gracefully

### 🏗️ Architecture Decision

**Minimal change set:**

| File | Change |
|------|--------|
| `components/projects/ProjectDetailPage.js` | Add delete button, delete confirmation dialog, and delete handler |
| `lib/mockData.js` | Add DELETE handler in `demoApiFetch` |

**Approach:** Follow the exact same pattern as the existing archive feature — add a `showDelete` state, a `handleDelete` async function, a `Button` with destructive styling, and a `Dialog` for confirmation. Place the delete button next to the archive button, visible only to admins.

**Patterns followed:**
- Same Dialog pattern as archive confirmation
- Same `apiFetch` + `queryClient.invalidateQueries` pattern
- Same admin-only conditional rendering (`profile?.role === 'admin'`)
- Same toast notification pattern

**No new dependencies needed.**

### 📋 Plan Review

**Verdict: APPROVED**

- Plan covers all scope requirements
- Minimal changes — only 2 files modified
- Follows existing patterns exactly
- No over-engineering
- Delete navigates back to projects list (correct UX for deleted resource)

### 🔒 Security Review

**Verdict: CLEAR**

- Admin-only access enforced at both API level (403 Forbidden) and UI level (conditional render)
- No new input vectors — project ID comes from URL parameter already in use
- Cascading deletes are handled by database constraints (ON DELETE CASCADE)
- No secrets or configuration changes

### 🧪 Test Plan

**Existing tests that could break:** None — no existing test covers a delete flow.

**New tests needed:**
- E2E test: Admin can delete a project from detail page (verify dialog, confirm, redirect)

**Validation commands:**
- `cd tests && npx playwright test projects.spec.ts`

## Relevant Files

- `components/projects/ProjectDetailPage.js` — Add delete button and confirmation dialog (follows archive pattern at lines 107-112, 293-306)
- `lib/mockData.js` — Add DELETE /projects/:id handler in demoApiFetch
- `app/api/[[...path]]/route.js` — Existing DELETE endpoint (no changes needed, lines 329-338)
- `tests/e2e/projects.spec.ts` — Add delete test

### New Files
None.

## Step by Step Tasks

### Step 1: Add delete state and handler to ProjectDetailPage (Architect)
- Add `const [showDelete, setShowDelete] = useState(false)` state
- Add `handleDelete` async function that calls `apiFetch(\`/projects/${id}\`, { method: 'DELETE' })`, invalidates queries, shows toast, and navigates to `/projects`

### Step 2: Add delete button to ProjectDetailPage header (Architect)
- Add a "Delete" button next to the existing archive button, admin-only
- Use destructive variant styling consistent with archive button
- Use `Trash2` icon (already imported)
- onClick opens the delete confirmation dialog

### Step 3: Add delete confirmation dialog (Architect)
- Add a `Dialog` component (same pattern as archive dialog at lines 293-306)
- Title: "Delete Project Permanently?"
- Description: Clear warning that this action is permanent and cannot be undone
- Cancel and Delete buttons

### Step 4: Add demo mode DELETE handler (Architect)
- In `lib/mockData.js`, add handling for `DELETE /projects/:id` in `demoApiFetch`
- Filter the project out of DEMO_PROJECTS and return `{ success: true }`

### Step 5: Add E2E test for project deletion (Test Engineer)
- Add test case in `tests/e2e/projects.spec.ts` for admin deleting a project

## Validation Commands

- `cd tests && npx playwright test projects.spec.ts` — Run project E2E tests

## Notes
- The API already supports hard DELETE with admin authorization — this is purely a frontend UI addition
- Archive (reversible) and Delete (permanent) are intentionally separate actions
- The confirmation dialog wording should clearly distinguish delete from archive
