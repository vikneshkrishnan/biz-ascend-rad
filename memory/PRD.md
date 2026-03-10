# Biz Ascend RAD™ — PRD (MVP v1.0)

## Overview
Revenue Acceleration Diagnostic platform for B2B growth consulting. Consultants diagnose, score, and accelerate client revenue growth systems.

## Tech Stack
- **Frontend**: Next.js 14, React 18, TanStack Query, shadcn/ui, Tailwind CSS
- **Backend**: Next.js API Routes → Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email/password)
- **Database**: Supabase (PostgreSQL via REST API)
- **Theme**: Dark mode (black + orange) / Light mode (colorful cards)

## Completed Features (Phase 1 MVP)
- [x] Authentication (Login + Session + Role-based: admin/consultant)
- [x] Demo Mode (explore full UI with mock data without Supabase)
- [x] Dashboard (overview cards, recent activity, sector distribution)
- [x] Project Management (list, create, detail, archive)
- [x] Screener Questionnaire (7 sections, 20 questions, stepper, auto-save)
- [x] Diagnostic Assessment (7 pillars, 54 questions, card options, auto-save, conditional branching)
- [x] Scoring Engine (RAD Score, maturity bands, pillar scores, primary constraint, RAPS)
- [x] Scores Visualization (heatmap, traffic lights, RAPS breakdown)
- [x] Admin User Management (CRUD, activate/deactivate)
- [x] Questionnaire Link Management (generate, copy, invalidate)
- [x] Public Questionnaire (combined screener + diagnostic, no auth required)
- [x] Reassessment Support (start new assessment, history table)
- [x] Dark/Light Theme Toggle
- [x] Responsive Design (desktop + mobile)
- [x] Complete API Backend (all endpoints for Supabase integration)

## Pending Features (Phase 2+)
- [ ] AI Report Generation (Claude integration for narratives)
- [ ] PDF Report Download
- [ ] Market Opportunity Report (per-country macro data)
- [ ] Online Report View (7 sections)
- [ ] 30-60-90 Day Action Plan
- [ ] Score Trend Charts (reassessment comparison)
- [ ] Forgot Password flow

## Setup Instructions
1. Run `/app/migrations/001_initial_schema.sql` in Supabase SQL Editor
2. Create admin user in Supabase Auth dashboard
3. Update profile role: `UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com'`

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
