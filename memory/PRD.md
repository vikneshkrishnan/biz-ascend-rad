# Biz Ascend RAD™ — PRD (MVP v1.0)

## Overview
Revenue Acceleration Diagnostic platform for B2B growth consulting. Consultants diagnose, score, and accelerate client revenue growth systems.

## Tech Stack
- **Frontend**: Next.js 14, React 18, TanStack Query, shadcn/ui, Tailwind CSS
- **Backend**: Next.js API Routes → Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email/password)
- **Database**: Supabase (PostgreSQL via REST API)
- **AI Integration**: Claude Sonnet 4 via Emergent LLM Key
- **Theme**: Dark mode (black + orange) / Light mode (colorful cards)

## Completed Features (Phase 1 MVP)

### Core UI & Navigation
- [x] Authentication (Login + Session + Role-based: admin/consultant)
- [x] Demo Mode (explore full UI with mock data without Supabase)
- [x] Dashboard (overview cards, recent activity, sector distribution)
- [x] Project Management (list, create, detail, archive)
- [x] Dark/Light Theme Toggle
- [x] Responsive Design (desktop + mobile)
- [x] App Shell with collapsible sidebar

### Questionnaires
- [x] Screener Questionnaire (7 sections, 20 questions, stepper, auto-save)
- [x] Diagnostic Assessment (7 pillars, 54 questions, card options, auto-save, conditional branching)
- [x] Public Questionnaire (combined screener + diagnostic, no auth required)
- [x] Questionnaire Link Management (generate, copy, invalidate)

### Scoring & Analytics
- [x] Scoring Engine (RAD Score, maturity bands, pillar scores, primary constraint, RAPS)
- [x] Scores Visualization (heatmap, traffic lights, RAPS breakdown)
- [x] Reassessment Support (start new assessment, history table)

### AI Report Generation (NEW - Completed Dec 2025)
- [x] Claude AI Integration via Emergent LLM Key
- [x] Python script for AI report generation (`/app/scripts/generate_report.py`)
- [x] API endpoint: POST `/api/projects/:id/report/generate`
- [x] API endpoint: GET `/api/projects/:id/report`
- [x] Executive Summary generation
- [x] Pillar-by-pillar narrative analysis
- [x] Positioning Assessment
- [x] Strategic Moat Score & Narrative
- [x] RAPS Narrative with improvement scenarios
- [x] 30-60-90 Day Action Plan generation
- [x] Market Opportunity Report (per-country macro analysis)
- [x] Report viewing dialog with comprehensive display
- [x] Demo mode mock report data

### Admin Features
- [x] Admin User Management (CRUD, activate/deactivate)
- [x] Complete API Backend (all endpoints for Supabase integration)

## Pending Features (Phase 2+)

### High Priority (P1)
- [ ] PDF Report Download (weasyprint integration)
- [ ] Score Trend Charts (reassessment comparison with Recharts)
- [ ] Mobile Responsiveness Verification

### Medium Priority (P2)
- [ ] Forgot Password flow
- [ ] Email notifications for report completion
- [ ] Export data to CSV

### Low Priority (P3)
- [ ] Code Refactoring (break down monolithic page.js)
- [ ] API route restructuring (file-based routing)

## Architecture

```
/app/
├── app/
│   ├── api/
│   │   └── [[...path]]/
│   │       └── route.js      # API router with all endpoints
│   ├── page.js               # Main SPA component
│   ├── layout.js             # Root layout with providers
│   ├── providers.js          # Theme provider
│   └── globals.css           # Global styles
├── components/
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── constants.js          # App constants, pillar definitions
│   ├── mockData.js           # Demo mode data
│   ├── supabase.js           # Supabase client
│   └── utils.js              # Utility functions
├── scripts/
│   └── generate_report.py    # Claude AI report generation
├── tests/
│   └── e2e/                  # Playwright tests
│       ├── core-flows.spec.ts
│       ├── projects.spec.ts
│       └── scores-report.spec.ts
└── migrations/
    └── 001_initial_schema.sql
```

## Key API Endpoints

### Authentication
- `GET /api/auth/me` - Get current user profile

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project detail
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Questionnaires
- `GET /api/projects/:id/screener` - Get screener responses
- `PUT /api/projects/:id/screener` - Save screener responses
- `POST /api/projects/:id/screener/submit` - Submit screener
- `GET /api/projects/:id/diagnostic` - Get diagnostic responses
- `PUT /api/projects/:id/diagnostic` - Save diagnostic responses
- `POST /api/projects/:id/diagnostic/submit` - Submit diagnostic

### Scores & Reports
- `GET /api/projects/:id/scores` - Get calculated scores
- `POST /api/projects/:id/report/generate` - Generate AI report
- `GET /api/projects/:id/report` - Get generated report

### Public Assessment
- `GET /api/assess/:token` - Get public questionnaire data
- `PUT /api/assess/:token` - Save responses
- `POST /api/assess/:token/submit` - Submit assessment

### Admin
- `GET /api/users` - List users (admin only)
- `POST /api/users` - Create user (admin only)
- `PATCH /api/users/:id` - Update user (admin only)
- `GET /api/admin/stats` - Platform statistics

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
EMERGENT_LLM_KEY=sk-emergent-xxx
NEXT_PUBLIC_BASE_URL=https://biz-ascend-rad.preview.emergentagent.com
```

## Setup Instructions

1. Run `/app/migrations/001_initial_schema.sql` in Supabase SQL Editor
2. Create admin user in Supabase Auth dashboard
3. Update profile role: `UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com'`
4. Set environment variables in `.env`

## Demo Mode

Access the full UI without Supabase setup:
1. Navigate to the login page
2. Click "Explore Demo" button
3. Full platform is accessible with mock data

## Testing

Test files located at `/app/tests/e2e/`:
- `core-flows.spec.ts` - Navigation and theme tests
- `projects.spec.ts` - Project management tests
- `scores-report.spec.ts` - Scores and AI report tests

Run tests: `cd /app/tests && npx playwright test`
