# Chore: Complete Authentication Flow (Login + Signup)

## Chore Description
Add a complete authentication flow with login and signup. Login already works with Supabase Auth (`signInWithPassword`). Signup is missing entirely — users can only be created by admins. Add a self-service signup page using `supabase.auth.signUp()` with name, email, password fields.

## Agent Reports

### Scope Analysis
- **Task:** Add SignupPage component with `supabase.auth.signUp()`, toggle between login/signup
- **Out of scope:** OAuth/social login, email verification UI, admin approval gate
- **Key assumption:** `handle_new_user()` Postgres trigger auto-creates profiles on signup
- **Acceptance criteria:** Users can sign up, get authenticated, profile auto-created in DB

### Architecture Decision
- **1 file to modify:** `app/page.js`
- Add `SignupPage` component using `supabase.auth.signUp({ email, password, options: { data: { name } } })`
- Add "Create account" / "Already have account" toggle links
- Add `/signup` hash route
- Existing trigger handles profile creation — no API changes needed

### Plan Review
**APPROVED** — Minimal single-file change, leverages existing infrastructure.

### Security Review
**CLEAR** — Supabase handles password hashing, rate limiting, and email validation server-side.

### Test Plan
1. Verify login still works
2. Sign up with name/email/password → redirected to dashboard
3. Check `profiles` table for auto-created profile
4. Log out and log back in with new credentials
5. Verify demo mode still works

## Relevant Files
- `app/page.js` — Contains LoginPage, auth context, hash router, and main App component

## Step by Step Tasks

### Step 1: Add `/signup` route to hash router
- Add `if (hash === '/signup') return { page: 'signup' }` to `matchRoute()`

### Step 2: Add SignupPage component
- Create `SignupPage` function with name, email, password, confirmPassword fields
- Use `supabase.auth.signUp()` with user_metadata containing name
- Match LoginPage styling (video background, card layout)
- Add "Already have an account? Sign In" link

### Step 3: Add "Create account" link to LoginPage
- Add link below the sign-in form that navigates to `/#/signup`

### Step 4: Wire SignupPage into App component
- Show SignupPage when `hash === '/signup'` (before auth check)

### Step 5: Validate
- Manual testing of signup → login → dashboard flow
- Verify profile in Supabase via MCP

## Validation Commands
- `mcp__Supabase__execute_sql` — Check profiles table for new signup
- Manual browser testing

## Notes
- The `handle_new_user()` trigger passes `raw_user_meta_data->>'name'` to profiles.name
- Supabase `signUp()` auto-signs in the user (triggers SIGNED_IN event)
- No API route changes needed — the trigger handles everything
