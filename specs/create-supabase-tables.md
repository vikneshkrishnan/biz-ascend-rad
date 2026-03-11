# Chore: Create Supabase Database Tables

## Chore Description
Execute the initial database migration (`migrations/001_initial_schema.sql`) against the Supabase project to create all required tables, indexes, triggers, and enable RLS.

## Agent Reports

### 🔍 Scope Analysis
- **Task:** Create 5 tables (profiles, projects, assessments, questionnaire_links, activity_log) with indexes, triggers, and RLS
- **Out of scope:** Organizations table (referenced in code but not in migration), RLS policies for authenticated users, data seeding
- **Assumptions:** auth.users exists (Supabase-provided), service role bypasses RLS
- **Acceptance criteria:** All 5 tables exist in public schema with correct columns, constraints, indexes, triggers, and RLS enabled

### 🏗️ Architecture Decision
- Execute migration SQL via Supabase MCP `apply_migration`
- Single migration, self-contained with proper dependency ordering
- No code changes needed — migration file already exists

### 📋 Plan Review
**APPROVED** — Minimal, complete, idempotent (uses IF NOT EXISTS), and reversible.

### 🔒 Security Review
**CLEAR** — RLS enabled on all tables, proper FK constraints, SECURITY DEFINER appropriate for auth trigger, CHECK constraints on enums.

### 🧪 Test Plan
1. Run `list_tables` after migration to confirm all 5 tables with correct columns
2. Verify indexes via SQL query
3. Verify triggers via SQL query

## Relevant Files
- `migrations/001_initial_schema.sql` — The migration SQL to execute

## Step by Step Tasks

### Step 1: Apply the migration
- Execute `001_initial_schema.sql` via Supabase MCP `apply_migration`

### Step 2: Validate tables
- Run `list_tables` to confirm all 5 tables exist with correct schema

### Step 3: Validate indexes and triggers
- Query `pg_indexes` and `pg_trigger` to verify

## Validation Commands
- `mcp__Supabase__list_tables` — Verify all tables exist
- `mcp__Supabase__execute_sql` — Verify indexes and triggers

## Notes
- The `organizations` table is referenced in API routes but not included in the migration file. May need a separate migration later.
- MongoDB dependency in package.json is unused — app uses Supabase exclusively.
