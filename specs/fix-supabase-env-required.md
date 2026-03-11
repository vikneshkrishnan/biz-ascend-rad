# Chore: Fix "supabaseUrl is required" Error

## Chore Description
The application crashes on startup with `Error: supabaseUrl is required` because `lib/supabase.js` calls `createClient()` with `process.env.NEXT_PUBLIC_SUPABASE_URL` which is `undefined`. No `.env.local` file exists in the project, and `.gitignore` excludes all `*.env` / `*.env.*` files. The user provided the Supabase URL: `https://wwwcenqjiumtvtkfvstd.supabase.co`.

## Agent Reports

### 🔍 Scope Analysis

**What exactly is being asked?**
Create a `.env.local` file with the required Supabase environment variables so `lib/supabase.js` can initialize the Supabase client without crashing. The user provided `NEXT_PUBLIC_SUPABASE_URL=https://wwwcenqjiumtvtkfvstd.supabase.co`.

**What is NOT being asked?**
- Not refactoring `lib/supabase.js` to add fallback/validation logic
- Not changing the Supabase client initialization pattern
- Not creating a `.env.example` template (unless beneficial as a side task)
- Not modifying `.gitignore` (it already excludes env files correctly)

**Assumptions:**
1. The user has a Supabase project at `https://wwwcenqjiumtvtkfvstd.supabase.co` — confirmed by user input
2. The user will provide or already has the `NEXT_PUBLIC_SUPABASE_ANON_KEY` — **RISKY: user only provided the URL, not the anon key**
3. The `SUPABASE_SERVICE_ROLE_KEY` is needed for the API route (`app/api/[[...path]]/route.js`) but is not strictly required for the client-side crash fix

**Ambiguities:**
- The user only provided the URL. The anon key is also required for `createClient()` to work. We need to ask the user for it, OR add a placeholder.

**Edge Cases:**
- If only URL is set but anon key is missing, `createClient()` may still throw (different error)
- The API route also uses `SUPABASE_SERVICE_ROLE_KEY` — missing this will cause server-side errors

**Dependencies touched:**
- `lib/supabase.js` — reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `app/api/[[...path]]/route.js` — reads `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- `next.config.js` — reads `CORS_ORIGINS`

**Acceptance Criteria:**
1. `.env.local` exists with `NEXT_PUBLIC_SUPABASE_URL` set
2. The app loads without the "supabaseUrl is required" error
3. `.env.local` is excluded from git (already handled by `.gitignore`)

### 🏗️ Architecture Decision

**Minimal changes required:**
1. Create `.env.local` with all required environment variables

**Change strategy:**
- Create a single new file: `.env.local` at project root
- Set `NEXT_PUBLIC_SUPABASE_URL=https://wwwcenqjiumtvtkfvstd.supabase.co`
- Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` — needs user input or placeholder
- Optionally set `SUPABASE_SERVICE_ROLE_KEY` placeholder for API route

**Tradeoffs:**
- Option A: Create `.env.local` with URL only + placeholder for anon key → App will still fail on Supabase operations
- Option B: Ask user for anon key → Complete fix but requires user input
- **Selected: Option A** — Create the file with the URL and a clear placeholder for the anon key. This fixes the immediate crash and makes it obvious what else is needed.

**Patterns followed:**
- Next.js convention: `.env.local` for local environment variables
- `NEXT_PUBLIC_` prefix for client-exposed variables (already in use)

**No new dependencies needed.**

### 📋 Plan Review

**Verdict: APPROVED**

- Plan is complete: covers the immediate crash fix
- Plan is minimal: one file creation
- No ordering concerns: single file
- Risk: low — `.env.local` is gitignored, no code changes
- Tests: N/A — this is a configuration fix
- Reversible: yes — delete the file

### 🔒 Security Review

**Verdict: CLEAR with notes**

- `.gitignore` already excludes `*.env` and `*.env.*` — secrets won't be committed ✅
- The user-provided URL is a public Supabase URL (non-secret) ✅
- Anon key will be set as a placeholder — user must fill it in ✅
- No code changes that could introduce injection or exposure risks ✅

**Note:** The anon key is a client-side key (public by design in Supabase's security model with RLS), so including it in `.env.local` is the standard pattern.

### 🧪 Test Plan

**Existing tests that could break:** None — no test files found in project.

**Validation sequence:**
1. Verify `.env.local` exists and contains correct values
2. Restart the Next.js dev server
3. Load `http://localhost:3000` and verify no "supabaseUrl is required" error

**Manual checks:**
- Confirm the page loads without the Supabase initialization error
- Check browser console for any remaining env-related errors

## Relevant Files

- `lib/supabase.js` — The file that crashes; reads env vars to create Supabase client
- `app/api/[[...path]]/route.js` — Server-side Supabase admin client; also needs env vars
- `.gitignore` — Already excludes `.env*` files (no changes needed)
- `memory/PRD.md` — Documents required env vars (lines 134-143)

### New Files
- `.env.local` — Local environment variables for Next.js

## Step by Step Tasks

### Step 1: Create `.env.local` with Supabase configuration
*Implements: Architect's plan*

- Create `.env.local` at project root
- Set `NEXT_PUBLIC_SUPABASE_URL=https://wwwcenqjiumtvtkfvstd.supabase.co`
- Add placeholder for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Add placeholder for `SUPABASE_SERVICE_ROLE_KEY` (needed by API route)
- Add other env vars from PRD as placeholders

### Step 2: Restart dev server and validate
*Implements: Test Engineer's validation*

- Stop existing dev server
- Restart with `npm run dev`
- Verify no "supabaseUrl is required" crash

## Validation Commands

```bash
# Verify .env.local exists and contains the URL
grep "NEXT_PUBLIC_SUPABASE_URL" .env.local

# Restart dev server and check for errors
npm run dev
```

## Notes
- The user must provide `NEXT_PUBLIC_SUPABASE_ANON_KEY` for full Supabase functionality. Without it, the client initializes but API calls will fail.
- The anon key can be found in the Supabase dashboard under Project Settings > API.
