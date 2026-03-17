# Chore: Fix Vercel Localhost URL Redirect

## Chore Description
When deployed to Vercel, the app generates URLs (questionnaire links, email notifications, password reset) using `http://localhost:3000` instead of the actual Vercel domain. This happens because `NEXT_PUBLIC_BASE_URL` falls back to localhost or empty string when not configured on Vercel.

## Agent Reports

### 🔍 Scope Analysis

**What exactly is being asked?**
Replace hardcoded/env-dependent base URLs in the API route with dynamic URL detection from the request headers, so URLs work correctly on any deployment (localhost, Vercel, custom domain).

**What is NOT being asked?**
- Changing frontend URLs (those already use `window.location.origin` which is correct)
- Changing Supabase config
- Changing deployment setup

**4 places in `app/api/[[...path]]/route.js` use `NEXT_PUBLIC_BASE_URL`:**
1. Line 455 — questionnaire link generation (POST create link) — fallback: `''`
2. Line 467 — questionnaire link retrieval (GET link) — fallback: `''`
3. Line 716 — report notification email URL — fallback: old emergentagent URL
4. Line 747 — password reset email URL — fallback: old emergentagent URL

**Fix:** Add a helper that derives base URL from the request's `host` header (works on Vercel, localhost, and any domain). Use `NEXT_PUBLIC_BASE_URL` as override only if explicitly set.

**Acceptance criteria:**
- All 4 URL constructions use the correct domain when deployed to Vercel
- Still works on localhost for development

### 🏗️ Architecture Decision

**Strategy:** Add a `getBaseUrl(request)` helper function at the top of `route.js` that:
1. Uses `NEXT_PUBLIC_BASE_URL` if set (explicit override)
2. Otherwise derives from request headers: `x-forwarded-proto` + `host` (standard on Vercel)

Then replace all 4 `process.env.NEXT_PUBLIC_BASE_URL || ...` usages with `getBaseUrl(request)`.

**Files to modify:**
1. `app/api/[[...path]]/route.js` — Add helper + update 4 usages

### 📋 Plan Review
**APPROVED** — Single file change, minimal, correct approach.

### 🔒 Security Review
**CLEAR** — Using request headers to derive URL is standard practice. `x-forwarded-proto` and `host` are set by Vercel's edge network and are trustworthy in this context.

### 🧪 Test Plan
- `npx next build` — Verify build passes
- Manual: verify questionnaire links on Vercel use the correct domain

## Relevant Files
- `app/api/[[...path]]/route.js` — API route with 4 localhost URL usages

## Step by Step Tasks

### Step 1: Add `getBaseUrl` helper to route.js
- Add helper function after the existing utility functions
- Derives URL from request headers with env var override

### Step 2: Replace all 4 `NEXT_PUBLIC_BASE_URL` usages
- Lines 455, 467, 716, 747

### Step 3: Validate build
- `npx next build`

## Validation Commands
- `npx next build` — Verify build passes
