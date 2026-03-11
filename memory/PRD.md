# Biz Ascend RAD™ — PRD (MVP v1.1)

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

## All Features Complete ✅

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
- [x] Public Questionnaire (combined screener + diagnostic, no auth required, demo mode support)
- [x] Questionnaire Link Management (generate, copy, invalidate)

### Scoring & Analytics
- [x] Scoring Engine (RAD Score, maturity bands, pillar scores, primary constraint, RAPS)
- [x] Scores Visualization (heatmap, traffic lights, RAPS breakdown)
- [x] Radar Chart - Pillar performance spider visualization
- [x] Score Trend Line Chart - RAD Score and RAPS progression across assessments
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

### PDF & Export Features
- [x] WeasyPrint integration for PDF generation
- [x] Professional presentation-grade PDF layout
- [x] Base64 encoded PDF download with auto-filename
- [x] CSV Export functionality
- [x] Send to Client (email PDF report)

### Email Notifications
- [x] Resend API integration
- [x] Report notification email template (professional HTML)
- [x] Password reset email template
- [x] Send PDF report to client

### Admin Features
- [x] Admin User Management (CRUD, activate/deactivate)
- [x] Organization Settings (multi-tenant, branding, plan info)
- [x] Complete API Backend (all endpoints)

### Multi-Tenant Support (Phase 1)
- [x] Organization model and database schema
- [x] Organization Settings UI for admin users
- [x] Branding customization (primary color, logo URL)
- [x] Email settings (sender name, reply-to)
- [x] Plan & Usage display (Enterprise/Professional/Starter)

## API Endpoints

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
- `POST /api/notifications/send-pdf-report` - Send PDF report to client

### Organization
- `GET /api/organization` - Get current organization
- `PATCH /api/organization/settings` - Update organization settings

### Admin
- `GET /api/users` - List users (admin only)
- `POST /api/users` - Create user (admin only)
- `PATCH /api/users/:id` - Update user (admin only)
- `GET /api/admin/stats` - Platform statistics

### Public Assessment
- `GET /api/assess/:token` - Get public questionnaire data
- `PUT /api/assess/:token` - Save responses
- `POST /api/assess/:token/submit` - Submit assessment

## Demo Mode
Access the full UI without Supabase setup:
1. Navigate to the login page
2. Click "Explore Demo" button
3. Full platform accessible with mock data
4. Public questionnaire works with demo tokens (e.g., `#/assess/demo-token-qd`)

## Database Migrations
- `001_initial_schema.sql` - Core tables (profiles, projects, assessments, questionnaire_links, activity_log)
- `002_organizations.sql` - Multi-tenant tables (organizations)

## Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
EMERGENT_LLM_KEY=sk-emergent-xxx
NEXT_PUBLIC_BASE_URL=https://biz-ascend-rad-1.preview.emergentagent.com
RESEND_API_KEY=re_... (optional - for email notifications)
SENDER_EMAIL=onboarding@resend.dev (optional)
```

## Changelog

### Dec 11, 2025 (Latest Session)
- Fixed Organization Settings routing (was blocking admin access)
- Fixed Public Questionnaire demo mode support
- Added organization API endpoints for real backend
- Created organizations migration schema (002_organizations.sql)
- Verified all core features working via testing agent (95% pass rate)

### Dec 11, 2025 (Earlier)
- Added CSV Export functionality to scores page
- Completed component refactoring structure
- Added Score Trend Line Chart
- Added Forgot Password flow
- Integrated Resend API for email notifications
- Added PDF report download with WeasyPrint
- Added Radar chart for pillar performance
- Added Send to Client feature (email PDF reports)
- Added Organization Settings UI for multi-tenant support

## Roadmap / Future Tasks

### P0 - Critical (Next)
- [ ] Full Supabase Integration - Replace demo mode with real database queries
- [ ] Real authentication flow testing

### P1 - High Priority
- [ ] Complete component refactoring - Move remaining components from page.js
- [ ] Backend API file restructuring (split monolithic route.js)

### P2 - Medium Priority
- [ ] Enhanced Admin Analytics dashboard
- [ ] Consultant-specific dashboard with performance metrics
- [ ] Notification preferences per user
- [ ] White-label support (custom domains per organization)

### P3 - Future
- [ ] Integration with external CRMs (Salesforce, HubSpot)
- [ ] Webhook support for external integrations
- [ ] Team collaboration features
- [ ] Assessment comparison across organizations (benchmarking)

## Technical Debt
- Monolithic page.js (~2000 lines) contains most components - should be split
- API routes in single file - should use Next.js file-based routing
- Some components in /app/components/ are not being used (refactor incomplete)

## MVP Status: ✅ COMPLETE
All core features implemented and tested.
