# Chore: Create Admin Account for Client Testing

## Chore Description
Create a pre-verified admin account in Supabase Auth with email and password, and ensure the corresponding `profiles` row has `role = 'admin'`. This allows the client to log in immediately and test admin functionality without needing email verification.

## Agent Reports

### 🔍 Scope Analysis

**What exactly is being asked?**
- Create a user in Supabase Auth (`auth.users`) with a specified email and password
- Mark the user's email as already verified (`email_confirmed_at` set)
- Ensure a corresponding `profiles` row exists with `role = 'admin'`

**What is NOT being asked?**
- No code changes to the application
- No schema migrations
- No changes to auth flow or RLS policies
- No deployment or CI/CD changes

**Assumptions:**
- The `handle_new_user()` trigger on `auth.users` will auto-create a profile row with `role = 'consultant'` (default)
- We need to UPDATE the profile to `role = 'admin'` after creation
- The client will provide or we'll set a specific email/password
- Project ID: `wwwcenqjiumtvtkfvstd`

**Ambiguities:**
- ⚠️ Email and password for the admin account not yet specified — must ask user before implementation

**Edge cases:**
- If email already exists in auth.users, the insert will fail — need to check first
- If the `handle_new_user` trigger fails, the profile won't be created — need to verify profile exists after auth user creation

**Dependencies:**
- Supabase Auth system
- `handle_new_user()` trigger (creates profile automatically)
- `profiles` table with role CHECK constraint allowing 'admin'

**Acceptance criteria:**
1. Auth user exists with specified email, password set, and `email_confirmed_at` is NOT NULL
2. Profile row exists with `role = 'admin'`, `is_active = true`
3. Client can log in with the credentials and access admin features

### 🏗️ Architecture Decision

**Strategy: SQL-only via Supabase MCP — Zero code changes**

This is a data-only chore. No application code needs to change. The approach:

1. **Step 1:** Insert a user into `auth.users` using Supabase's `auth.admin` SQL functions, with `email_confirmed_at` pre-set
2. **Step 2:** Verify the `handle_new_user` trigger created the profile
3. **Step 3:** Update the profile role to `admin`
4. **Step 4:** Verify the complete setup

**SQL approach:**
- Use Supabase's internal auth schema to create a verified user
- The recommended approach is using `supabase_auth_admin` or direct SQL insert into `auth.users` with proper fields
- Actually, the cleanest way is to use Supabase's `auth.users` insert with `encrypted_password` using `crypt()` and set `email_confirmed_at = now()`

**Files affected: 0** — This is purely a database operation.

**Tradeoffs:**
- Direct SQL insert vs. Supabase Dashboard UI: SQL is reproducible and can be documented
- We use `crypt()` with `gen_salt('bf')` for bcrypt password hashing (Supabase standard)

### 📋 Plan Review

**Verdict: APPROVED**

- Plan is minimal — zero code changes, SQL-only operations
- Correct dependency order: create auth user → verify trigger → update role → verify
- Fully reversible: can delete the user from auth.users (cascade will clean up profile)
- No tests needed for a data seeding operation

### 🔒 Security Review

**Verdict: FINDINGS — Medium severity**

| Finding | Severity | Mitigation |
|---------|----------|------------|
| Password will be visible in this plan file | Medium | Do NOT hardcode the password in the spec file. Ask user at implementation time. Use a strong password. |
| Admin account gives full access | Low | Expected behavior — this is the purpose of the chore |

**Mitigations integrated:**
- Password will be provided by the user at implementation time, not stored in specs
- Will use bcrypt hashing (Supabase standard) — password never stored in plaintext in the database

### 🧪 Test Plan

**Validation sequence (all via Supabase SQL):**

1. Verify auth user exists: `SELECT id, email, email_confirmed_at FROM auth.users WHERE email = '<admin-email>'`
2. Verify profile exists with admin role: `SELECT id, email, role, is_active FROM public.profiles WHERE email = '<admin-email>'`
3. Verify profile.auth_id matches auth.users.id
4. Manual check: Client logs in via the application with the credentials

**No automated test changes needed** — this is a data seeding operation, not a code change.

## Relevant Files
- `migrations/001_initial_schema.sql` — Contains the `handle_new_user()` trigger that auto-creates profiles (reference only, no changes)

### New Files
None.

## Step by Step Tasks

### Step 1: Get admin credentials from user (Scope Analyst)
- Ask for the desired email address and password for the admin account

### Step 2: Check if email already exists (Scope Analyst — edge case)
- Query `auth.users` to ensure the email isn't already taken

### Step 3: Create verified auth user (Architect)
- Insert into `auth.users` with:
  - Specified email
  - bcrypt-hashed password
  - `email_confirmed_at = now()` (pre-verified)
  - `role = 'authenticated'` (Supabase standard auth role)
  - Proper metadata fields

### Step 4: Verify trigger created profile (Architect)
- Query `public.profiles` to confirm the `handle_new_user` trigger fired
- If profile doesn't exist, manually create it

### Step 5: Update profile to admin role (Architect)
- `UPDATE public.profiles SET role = 'admin' WHERE email = '<admin-email>'`

### Step 6: Verify complete setup (Test Engineer)
- Run all validation queries from the Test Plan
- Confirm auth user is verified and profile has admin role

## Validation Commands

```sql
-- 1. Verify auth user exists and is verified
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = '<admin-email>';

-- 2. Verify profile has admin role
SELECT id, auth_id, email, role, is_active FROM public.profiles WHERE email = '<admin-email>';

-- 3. Cross-reference auth_id
SELECT p.email, p.role, a.email_confirmed_at
FROM public.profiles p
JOIN auth.users a ON p.auth_id = a.id
WHERE p.email = '<admin-email>';
```

No `pytest` or `jest` commands needed — zero code changes.

## Notes
- The `handle_new_user()` trigger sets role from `raw_user_meta_data->>'role'`, defaulting to 'consultant'. We could pass `role: 'admin'` in metadata to skip the UPDATE step, but updating after is simpler and more explicit.
- Password is hashed with bcrypt via `crypt(password, gen_salt('bf'))` — standard Supabase approach.
