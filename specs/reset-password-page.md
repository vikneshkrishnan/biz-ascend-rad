# Chore: Implement Reset Password Page

## Chore Description
When a user clicks "Forgot Password" on the login page, they enter their email and receive a reset link. However, clicking the reset link leads to a non-existent page. We need to implement the actual reset password page that allows users to set a new password.

## Agent Reports

### 🔍 Scope Analysis

**What exactly is being asked?**
- Create a password reset page accessible via Supabase's password reset flow
- When Supabase sends a reset email, the link contains a token. The user clicks it, lands on a page where they enter a new password, and the password is updated.

**What is NOT being asked?**
- Changing the forgot password email sending flow (already works)
- Changing the login page UI
- Implementing email templates (already handled by Supabase)

**Assumptions:**
1. Supabase Auth handles the reset email and token validation
2. The app uses hash-based routing in `page.js`, but Supabase redirects to a real URL path (`/reset-password`)
3. Supabase appends auth tokens as URL fragments (hash params) when redirecting — this conflicts with the existing hash router
4. **Key insight**: Supabase redirects to `{redirectTo}#access_token=...&type=recovery` — the app needs a real Next.js page at `/reset-password` that reads these tokens and calls `supabase.auth.updateUser()`

**Edge cases:**
- Expired or invalid reset token
- User navigating to `/reset-password` without a token
- Password mismatch between password and confirm fields
- Password too short (< 6 chars)
- Network errors during password update

**Acceptance criteria:**
1. User clicks reset link in email → lands on a functional reset password page
2. Page shows two password fields (new password + confirm)
3. Validation: passwords match, minimum 6 characters
4. On success: password is updated, user is redirected to login with a success message
5. On error: appropriate error message is shown

### 🏗️ Architecture Decision

**Approach**: Create a new Next.js page at `app/reset-password/page.js` (a real route, not hash-based) because Supabase redirects to a real URL path. This page will:
1. Detect the Supabase recovery session from URL fragments
2. Show a form for entering a new password
3. Call `supabase.auth.updateUser({ password })` to set the new password
4. Redirect to the main app's login page on success

**Also update**: The `redirectTo` URL in the forgot password handler to point to the correct URL.

**Files to modify:**
1. `app/reset-password/page.js` — **NEW** — Reset password page
2. `app/page.js` — Update `redirectTo` URL in `ForgotPasswordPage` (line 226)

**Why a separate Next.js page?**
Supabase redirects to `{origin}/reset-password#access_token=...&type=recovery`. Since the main app uses `#` for hash routing, a hash-based route would conflict with Supabase's token fragments. A dedicated Next.js page cleanly handles the Supabase redirect without interfering with the SPA router.

**Patterns to follow:**
- Same UI style as login/forgot password pages (white background, Card component, same styling)
- Same form patterns (Label, Input, Button from shadcn/ui)
- Password show/hide toggle (same as login page)
- Toast notifications via `sonner`
- `supabase` client from `@/lib/supabase`

### 📋 Plan Review
**APPROVED**

The plan is minimal and correct:
- Only 2 files touched (1 new, 1 minor edit)
- No unnecessary abstractions
- Follows existing codebase patterns exactly
- The approach of using a real Next.js page is architecturally correct given the hash router conflict

### 🔒 Security Review
**CLEAR**

- Password update uses Supabase's built-in `updateUser()` — secure by design
- No custom token handling — Supabase SDK manages session recovery internally
- Password validation (length, match) is client-side UX; Supabase enforces server-side rules
- No secrets exposed — uses same public Supabase client as rest of app
- No injection risks — no direct SQL or command execution

### 🧪 Test Plan

**Existing tests that could break:** None — existing `forgot-password.spec.ts` tests only cover the email submission flow, not the reset page.

**Manual validation:**
1. Navigate to `/reset-password` directly — should show error/redirect (no valid session)
2. Go through forgot password flow → click email link → should land on reset page
3. Submit mismatched passwords → should show error
4. Submit short password → should show error
5. Submit valid password → should update and redirect to login

**Build validation:**
- `yarn build` must pass (ensures new page compiles)

## Relevant Files

- `app/page.js` — Contains `ForgotPasswordPage` with `redirectTo` URL (line 226) that needs updating
- `app/reset-password/page.js` — **NEW** — The reset password page
- `lib/supabase.js` — Supabase client used for `updateUser()`
- `components/auth/LoginPage.js` — Reference for UI patterns and styling
- `components/ui/button.jsx`, `card.jsx`, `input.jsx`, `label.jsx` — UI components to use

### New Files
- `app/reset-password/page.js` — Reset password page with form to set new password

## Step by Step Tasks

### Step 1: Create the Reset Password Page (Architect)
- Create `app/reset-password/page.js` with:
  - `'use client'` directive
  - Supabase session detection via `onAuthStateChange` listening for `PASSWORD_RECOVERY` event
  - Password + confirm password form with show/hide toggles
  - Client-side validation (match, min length)
  - `supabase.auth.updateUser({ password })` on submit
  - Success state redirecting to main app login (`/#/login`)
  - Error handling for expired/invalid tokens
  - UI matching existing auth pages (white bg, Card, same input styling)

### Step 2: Update redirectTo URL (Architect)
- In `app/page.js` line 226, update `redirectTo` from `/reset-password` to `${window.location.origin}/reset-password`
  - This is already correct — no change needed. Supabase needs the full URL but `window.location.origin` + `/reset-password` is what's already there.

### Step 3: Validate Build
- Run `yarn build` to ensure the new page compiles

## Validation Commands

- `yarn build` — Verify build passes with new page

## Notes
- Supabase sends recovery tokens as URL hash fragments (`#access_token=...&type=recovery`). The Supabase JS client automatically picks these up via `onAuthStateChange` with event type `PASSWORD_RECOVERY`.
- The `redirectTo` URL must be added to Supabase's "Redirect URLs" allowlist in the Supabase dashboard for production.
