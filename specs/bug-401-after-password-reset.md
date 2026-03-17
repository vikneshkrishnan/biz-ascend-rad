# Bug: 401 Unauthorized on /api/auth/me After Password Reset

## Bug Description
After a user resets their password via the `/reset-password` page and clicks "Go to Login", the main app loads and immediately gets repeated `401 Unauthorized` responses from `GET /api/auth/me`. The user is stuck on the login page despite having successfully reset their password.

**Expected behavior:** After resetting password, user is redirected to login, signs in with new password, and accesses the dashboard normally.

**Actual behavior:** After resetting password, the app detects a stale Supabase recovery session, attempts to authenticate with an invalidated access token, and gets 401 repeatedly.

## Problem Statement
The reset password page (`app/reset-password/page.js`) calls `supabase.auth.updateUser({ password })` to set the new password but does NOT sign the user out afterward. The recovery session persists in localStorage. When the user navigates to the main app (`/#/login`), the `checkAuth()` function finds this stale session, extracts its access token, and sends it to `/api/auth/me`. However, the token from the recovery session is no longer valid after the password change (Supabase invalidates/rotates tokens on password update), causing the 401.

## Solution Statement
After successfully updating the password on the reset page, call `supabase.auth.signOut()` to clear the recovery session from localStorage. This ensures the user arrives at the login page with a clean slate and must sign in with their new password — the standard and expected flow.

## Steps to Reproduce
1. Go to the login page, click "Forgot password?"
2. Enter email, click "Send Reset Link"
3. Click the reset link from the email → lands on `/reset-password`
4. Enter new password, confirm, click "Update Password"
5. Click "Go to Login"
6. Observe: console shows repeated `GET /api/auth/me 401` errors

## Root Cause Analysis
The flow breaks at step 5-6:

1. `supabase.auth.updateUser({ password })` updates the password and Supabase rotates the session tokens
2. The reset page shows a success screen with "Go to Login" button but the old/stale recovery session remains in Supabase's localStorage
3. User clicks "Go to Login" → `window.location.href = '/#/login'`
4. Main app (`page.js`) loads → `useEffect` runs `checkAuth()`
5. `checkAuth()` calls `supabase.auth.getSession()` which returns the stale recovery session from localStorage
6. Since a session exists, it calls `apiFetch('/auth/me')` with the old access token
7. The API's `getUser()` validates the token with `supabaseAdmin.auth.getUser(token)` — the token is invalid → returns `null` → 401

The fix is to sign out after password update so no stale session persists.

## Relevant Files
Use these files to fix the bug:

- `app/reset-password/page.js` — The reset password page where `updateUser` is called but `signOut` is missing. This is the only file that needs modification.

## Step by Step Tasks

### Step 1: Add signOut after successful password update
- In `app/reset-password/page.js`, after `supabase.auth.updateUser({ password })` succeeds, call `await supabase.auth.signOut()` to clear the recovery session before showing the success state.
- This ensures no stale session remains in localStorage when the user navigates to the login page.

### Step 2: Validate build
- Run `npx next build` to confirm the change compiles.

## Validation Commands
- `npx next build` — Verify build passes with the fix

## Notes
- This is a single-line fix: adding `await supabase.auth.signOut()` after the successful `updateUser` call.
- The `signOut()` call clears the session from Supabase's localStorage, so when the user lands on the main app's login page, `checkAuth()` will correctly find no session and show the login form.
- The user then signs in with their new password via the normal login flow, which creates a fresh, valid session.
