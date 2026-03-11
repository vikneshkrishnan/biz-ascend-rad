# Biz Ascend RAD™ — PRD (MVP v1.0)

## Overview
Revenue Acceleration Diagnostic platform for B2B growth consulting. Consultants diagnose, score, and accelerate client revenue growth systems.

## Tech Stack
- **Frontend**: Next.js 14, React 18, TanStack Query, shadcn/ui, Tailwind CSS, Recharts
- **Backend**: Next.js API Routes → Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email/password)
- **Database**: Supabase (PostgreSQL via REST API)
- **AI Integration**: Claude Sonnet 4 via Emergent LLM Key
- **PDF Generation**: WeasyPrint (Python)
- **Email Service**: Resend API
- **Theme**: Dark mode (black + orange) / Light mode (colorful cards)

## Completed Features

### Core UI & Navigation
- [x] Authentication (Login + Session + Role-based: admin/consultant)
- [x] **Forgot Password Flow** (UI with mock flow for demo mode)
- [x] Demo Mode (explore full UI with mock data without Supabase)
- [x] Dashboard (overview cards, recent activity, sector distribution)
- [x] Project Management (list, create, detail, archive)
- [x] Dark/Light Theme Toggle
- [x] Responsive Design (desktop + tablet + mobile)
- [x] App Shell with collapsible sidebar

### Questionnaires
- [x] Screener Questionnaire (7 sections, 20 questions, stepper, auto-save)
- [x] Diagnostic Assessment (7 pillars, 54 questions, card options, auto-save)
- [x] Public Questionnaire (combined screener + diagnostic, no auth required)
- [x] Questionnaire Link Management (generate, copy, invalidate)

### Scoring & Analytics
- [x] Scoring Engine (RAD Score, maturity bands, pillar scores, primary constraint, RAPS)
- [x] Scores Visualization (heatmap, traffic lights, RAPS breakdown)
- [x] Radar Chart - Pillar performance visualization (Recharts)
- [x] Bar Chart - Horizontal pillar scores comparison (Recharts)
- [x] Reassessment Support (start new assessment, history table)

### AI Report Generation
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

### PDF Report Download
- [x] WeasyPrint integration for PDF generation (`/app/scripts/generate_pdf.py`)
- [x] API endpoint: GET `/api/projects/:id/report/pdf`
- [x] Professional presentation-grade PDF layout
- [x] Includes: Executive Summary, Pillar Analysis, RAPS, Action Plan
- [x] Base64 encoded PDF download with auto-filename
- [x] "Download PDF" button in UI

### Email Notifications (NEW - Dec 2025)
- [x] Resend API integration (`/app/scripts/email_service.py`)
- [x] Report notification email template (professional HTML)
- [x] Password reset email template
- [x] API endpoint: POST `/api/notifications/send-report`
- [x] API endpoint: POST `/api/notifications/password-reset`

### Admin Features
- [x] Admin User Management (CRUD, activate/deactivate)
- [x] Complete API Backend (all endpoints for Supabase integration)

### Code Refactoring (Partial - P3)
- [x] Created component structure under `/components/`
  - `/components/auth/` - LoginPage, ForgotPasswordPage
  - `/components/dashboard/` - DashboardPage
  - `/components/layout/` - AppShell
  - `/components/projects/` - ProjectsListPage, CreateProjectPage
  - `/components/shared/` - Context, UI helpers
- [ ] Full migration of page.js to use new components (deferred - working as-is)

## Pending Features (Phase 2+)

### Medium Priority (P2)
- [ ] Full Supabase live integration (currently demo mode only)
- [ ] Score Trend Line Chart (RAD score progression across reassessments)

### Low Priority (P3)
- [ ] Complete code refactoring (finish migrating remaining components)
- [ ] API route restructuring to file-based routing
- [ ] CSV export functionality

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
│   ├── auth/                 # Login, ForgotPassword
│   ├── dashboard/            # Dashboard page
│   ├── layout/               # AppShell
│   ├── projects/             # Projects pages
│   ├── shared/               # Context, helpers
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── constants.js          # App constants, pillar definitions
│   ├── mockData.js           # Demo mode data
│   ├── supabase.js           # Supabase client
│   └── utils.js              # Utility functions
├── scripts/
│   ├── generate_report.py    # Claude AI report generation
│   ├── generate_pdf.py       # WeasyPrint PDF generation
│   └── email_service.py      # Resend email notifications
├── tests/
│   └── e2e/                  # Playwright tests
│       ├── core-flows.spec.ts
│       ├── forgot-password.spec.ts
│       ├── projects.spec.ts
│       └── scores-report.spec.ts
├── test_reports/
│   └── iteration_2.json      # Latest test results
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
- `GET /api/projects/:id/report/pdf` - Download PDF report

### Notifications
- `POST /api/notifications/send-report` - Send report notification email
- `POST /api/notifications/password-reset` - Send password reset email

### Public Assessment
- `GET /api/assess/:token` - Get public questionnaire data
- `PUT /api/assess/:token` - Save responses
- `POST /api/assess/:token/submit` - Submit assessment

### Admin
- `GET /api/users` - List users (admin only)
- `POST /api/users` - Create user (admin only)
- `PATCH /api/users/:id` - Update user (admin only)
- `GET /api/admin/stats` - Platform statistics

## Test Results (Latest)

```json
{
  "total_specs": 4,
  "total_tests": 21,
  "passed": 21,
  "failed": 0,
  "success_rate": "100%"
}
```

## Demo Mode

Access the full UI without Supabase setup:
1. Navigate to the login page
2. Click "Explore Demo" button
3. Full platform is accessible with mock data
4. Navigate to Projects → Select project → View Scores
5. Use "Generate AI Report", "View Report", "Download PDF" buttons
6. Click "Forgot password?" to test password reset flow (mock)

## Changelog

### Dec 11, 2025
- Added Forgot Password flow (UI with mock for demo mode)
- Integrated Resend API for email notifications
- Created component structure under /components/
- Added email notification API endpoints
- All 21 E2E tests passing

### Dec 11, 2025 (Earlier)
- Added PDF report download with WeasyPrint
- Added Radar chart for pillar performance visualization
- Added Bar chart for pillar scores comparison
- Fixed mobile responsiveness (tablet view verified)

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
EMERGENT_LLM_KEY=sk-emergent-xxx
NEXT_PUBLIC_BASE_URL=https://biz-ascend-rad.preview.emergentagent.com
RESEND_API_KEY=re_... (optional - for email notifications)
SENDER_EMAIL=onboarding@resend.dev (optional)
```
