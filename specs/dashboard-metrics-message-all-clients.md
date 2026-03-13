# Chore: Dashboard Metrics Message for All Clients

## Chore Description
Change the dashboard subtitle text below "Welcome, {User}" so that ALL users (not just admins) see "Platform metrics are showing strong growth across all sectors." Currently, non-admin users see "You're on track to complete your quarterly growth objectives." instead.

## Agent Reports

### 🔍 Scope Analysis

**What exactly is being asked?**
Remove the conditional that shows different subtitle text for admin vs non-admin users on the dashboard. Show "Platform metrics are showing strong growth across all sectors." for everyone.

**What is NOT being asked?**
- No changes to dashboard stats, charts, or functionality
- No changes to admin vs non-admin stat cards or content
- No changes to the `components/dashboard/DashboardPage.js` (separate component, not used by main app)

**Assumptions:**
- The message text should remain exactly as-is: "Platform metrics are showing strong growth across all sectors."
- Only the subtitle text changes; the conditional admin/non-admin logic for stat cards and other content stays

**Ambiguities:** None — the chore is straightforward.

**Edge cases:** None — purely a text change.

**Dependencies:** Only `app/page.js` line 562-566.

**Acceptance criteria:** All users see "Platform metrics are showing strong growth across all sectors." below the welcome heading.

### 🏗️ Architecture Decision

**File:** `app/page.js` — 1 file, 1 change

**Change:** Replace the ternary `{isAdmin ? "Platform metrics..." : "You're on track..."}` with the static string `"Platform metrics are showing strong growth across all sectors."`

### 📋 Plan Review
**APPROVED** — Minimal, single-line change.

### 🔒 Security Review
**CLEAR** — Static text change only.

### 🧪 Test Plan
- Visual check: login as non-admin user, verify message on dashboard
- No existing tests target this subtitle text

## Relevant Files
- `app/page.js` — Contains the DashboardPage component (line 497) with the conditional text at lines 562-566

### New Files
None

## Step by Step Tasks

### Step 1: Replace conditional subtitle with static text
- Change lines 562-566 in `app/page.js` to show the same message for all users

## Validation Commands
- Visual inspection of dashboard for both admin and non-admin users

## Notes
- The `components/dashboard/DashboardPage.js` has a similar pattern but is not used by the main app routing.
