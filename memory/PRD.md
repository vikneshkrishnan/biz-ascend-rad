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

## Completed Features (100% MVP)

### Core UI & Navigation
- [x] Authentication (Login + Session + Role-based: admin/consultant)
- [x] Forgot Password Flow (UI with mock flow for demo mode)
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
- [x] **Radar Chart** - Pillar performance spider visualization (Recharts)
- [x] **Score Trend Line Chart** - RAD Score and RAPS progression across assessments
- [x] Reassessment Support (start new assessment, history table)

### AI Report Generation
- [x] Claude AI Integration via Emergent LLM Key
- [x] Executive Summary generation
- [x] Pillar-by-pillar narrative analysis
- [x] Positioning Assessment
- [x] Strategic Moat Score & Narrative
- [x] RAPS Narrative with improvement scenarios
- [x] 30-60-90 Day Action Plan generation
- [x] Market Opportunity Report (per-country macro analysis)
- [x] Report viewing dialog with comprehensive display

### PDF Report Download
- [x] WeasyPrint integration for PDF generation
- [x] Professional presentation-grade PDF layout
- [x] Includes: Executive Summary, Pillar Analysis, RAPS, Action Plan
- [x] Base64 encoded PDF download with auto-filename

### Email Notifications
- [x] Resend API integration
- [x] Report notification email template (professional HTML)
- [x] Password reset email template
- [x] API endpoints for sending notifications

### Admin Features
- [x] Admin User Management (CRUD, activate/deactivate)
- [x] Complete API Backend (all endpoints)

### Code Refactoring (COMPLETE)
- [x] Modular component structure under `/components/`
  - `/components/auth/` - LoginPage, ForgotPasswordPage
  - `/components/dashboard/` - DashboardPage
  - `/components/layout/` - AppShell
  - `/components/projects/` - ProjectsListPage, CreateProjectPage, ProjectDetailPage
  - `/components/users/` - AdminUsersPage
  - `/components/shared/` - Context, UI helpers

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

## Architecture

```
/app/
├── app/
│   ├── api/[[...path]]/route.js  # API router (648 lines)
│   ├── page.js                    # Main SPA (1604 lines)
│   ├── layout.js                  # Root layout
│   ├── providers.js               # Theme provider
│   └── globals.css                # Global styles
├── components/
│   ├── auth/                      # Authentication components
│   │   ├── LoginPage.js
│   │   └── index.js
│   ├── dashboard/                 # Dashboard components
│   │   ├── DashboardPage.js
│   │   └── index.js
│   ├── layout/                    # Layout components
│   │   ├── AppShell.js
│   │   └── index.js
│   ├── projects/                  # Project components
│   │   ├── ProjectsListPage.js
│   │   ├── CreateProjectPage.js
│   │   ├── ProjectDetailPage.js
│   │   └── index.js
│   ├── users/                     # User management
│   │   ├── AdminUsersPage.js
│   │   └── index.js
│   ├── shared/                    # Shared utilities
│   │   ├── context.js
│   │   ├── ui-helpers.js
│   │   └── index.js
│   └── ui/                        # shadcn/ui components
├── lib/
│   ├── constants.js               # App constants
│   ├── mockData.js                # Demo mode data
│   ├── supabase.js                # Supabase client
│   └── utils.js                   # Utilities
├── scripts/
│   ├── generate_report.py         # Claude AI report
│   ├── generate_pdf.py            # WeasyPrint PDF
│   └── email_service.py           # Resend emails
├── tests/e2e/                     # Playwright tests
│   ├── core-flows.spec.ts
│   ├── forgot-password.spec.ts
│   ├── projects.spec.ts
│   └── scores-report.spec.ts
└── test_reports/
    └── iteration_3.json           # Latest test results
```

## Key API Endpoints

### Authentication
- `GET /api/auth/me` - Get current user profile

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project detail
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Archive project

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
- `POST /api/notifications/send-report` - Send report notification
- `POST /api/notifications/password-reset` - Send password reset

### Admin
- `GET /api/users` - List users (admin only)
- `POST /api/users` - Create user (admin only)
- `PATCH /api/users/:id` - Update user (admin only)
- `GET /api/admin/stats` - Platform statistics

## Demo Mode

Access the full UI without Supabase setup:
1. Navigate to the login page
2. Click "Explore Demo" button
3. Full platform accessible with mock data
4. Acme Corporation (proj-001) has 3 assessments for trend chart demo
5. Nova Health (proj-002) has 3 assessments showing improvement trend

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

## Changelog

### Dec 11, 2025 (Session Complete)
- Added Score Trend Line Chart (RAD Score + RAPS progression)
- Updated mock data: Acme & Nova now have 3 assessments each
- Completed component refactoring:
  - Created `/components/auth/` with LoginPage, ForgotPasswordPage
  - Created `/components/dashboard/` with DashboardPage
  - Created `/components/layout/` with AppShell
  - Created `/components/projects/` with all project components
  - Created `/components/users/` with AdminUsersPage
  - Created `/components/shared/` with context and helpers
- All 21 E2E tests passing (100% success rate)

### Dec 11, 2025 (Earlier)
- Added Forgot Password flow (UI with mock for demo mode)
- Integrated Resend API for email notifications
- Added PDF report download with WeasyPrint
- Added Radar chart for pillar performance
- Fixed mobile responsiveness

## Pending (Future Phases)

### Phase 2 (Optional)
- [ ] Full Supabase live integration (currently demo mode)
- [ ] CSV export functionality
- [ ] Email delivery of PDF reports to clients
- [ ] Multi-tenant support

### Technical Debt
- [ ] Migrate remaining components from page.js to /components/
- [ ] API route restructuring to file-based routing
- [ ] Add unit tests for Python scripts
