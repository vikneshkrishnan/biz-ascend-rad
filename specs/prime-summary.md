# Prime Summary: Biz Ascend RAD

> Generated on: 2026-03-20
> Analyzer: Claude Code -- Prime Command
> Last updated: 2026-03-22 (refreshed line counts and structure)

---

## 1. Project Overview

- **Name**: Biz Ascend RAD (Revenue Acceleration Diagnostic)
- **Description**: A B2B diagnostic platform that evaluates companies across 9 growth pillars (80 scored questions), calculates weighted RAD scores and RAPS (Revenue Achievement Probability Score), generates AI-powered diagnostic reports with market intelligence, and produces 30-60-90 day action plans. Supports multi-tenant organizations, questionnaire distribution via tokenized links, and PDF export.
- **Type**: Full-stack web application (single-page app with API routes)
- **Language**: JavaScript (ES modules)
- **Framework**: Next.js 14.2
- **License**: Private

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | (managed by Next.js) |
| Framework | Next.js | 14.2.35 |
| Database | PostgreSQL (Supabase) | 17.6 |
| ORM | Supabase JS Client | ^2.49.0 |
| Auth | Supabase Auth | Built-in |
| AI | Anthropic Claude SDK | ^0.78.0 |
| AI Model | Claude Sonnet 4.6 | claude-sonnet-4-6 |
| UI Components | Radix UI + shadcn/ui | Various |
| Charts | Recharts | ^2.15.3 |
| PDF | jsPDF | ^4.2.0 |
| CSS | Tailwind CSS | ^3.4.1 |
| Testing | Playwright | (e2e) |
| Deployment | Vercel | (inferred from config) |

## 3. Architecture

**Pattern**: Monolith (single Next.js app)
**Style**: Mega-file SPA with catch-all API route

### Request Lifecycle
1. Client-side SPA (`app/page.js`, 2838 lines) handles all routing via hash-based navigation
2. API calls go to `app/api/[[...path]]/route.js` (1130 lines) -- a single catch-all route handler
3. API route uses Supabase service role key (bypasses RLS) for all DB operations
4. AI report generation calls Claude Sonnet via `@anthropic-ai/sdk` with structured output schemas and web search for market intel
5. PDF generation is client-side via jsPDF (2109 lines in `lib/generatePdf.js`)

### Key Decisions
- **Single-file SPA**: All page components (Login, Dashboard, Screener, Diagnostic, Scores, PublicAssess) live in `app/page.js`
- **Catch-all API**: All ~45 endpoints in one route handler with manual path matching
- **Supabase service role on server**: All DB access through admin client, no client-side DB queries
- **Client-side PDF**: jsPDF generates reports in-browser rather than server-side
- **Demo mode**: Full client-side mock data system for UI testing without Supabase
- **9-pillar weighted scoring**: Rebrief spec weights summing to 1.00 with 4-band maturity classification
- **AI Report Agent**: Uses Claude with structured output schemas (executive summary, pillar narratives, competitive clarity, action plans, market intel)

## 4. Directory Structure

```
.
├── app/
│   ├── page.js              # Main SPA (2838 lines) - all pages
│   ├── layout.js             # Root layout
│   ├── providers.js           # Theme provider
│   ├── globals.css            # Global styles
│   ├── reset-password/page.js # Standalone reset password page
│   └── api/[[...path]]/
│       └── route.js           # Catch-all API (1130 lines, ~45 endpoints)
├── components/
│   ├── ui/                    # shadcn/ui primitives (24 files)
│   ├── shared/                # Shared context, helpers (3 files)
│   ├── layout/AppShell.js     # App shell/sidebar
│   ├── auth/                  # Auth components (empty)
│   ├── projects/              # Project components (empty)
│   ├── scores/                # Scores components (empty)
│   ├── users/                 # User components (empty)
│   └── dashboard/             # Dashboard components (empty)
├── lib/
│   ├── constants.js           # All questions, pillars, weights, options (377 lines)
│   ├── rapsCalculation.js     # RAPS scoring engine (227 lines)
│   ├── reportAgent.js         # Claude AI report + market intel (1508 lines)
│   ├── generatePdf.js         # Client-side PDF generation (2109 lines)
│   ├── mockData.js            # Demo mode data (480 lines)
│   ├── supabase.js            # Client-side Supabase init (6 lines)
│   ├── passwordValidation.js  # Password strength rules (12 lines)
│   └── utils.js               # Tailwind merge utility (12 lines)
├── hooks/                     # React hooks (use-mobile, use-toast)
├── migrations/                # 5 SQL migration files
├── tests/e2e/                 # 5 Playwright test specs
├── specs/                     # Feature specs and docs (~40 files)
├── scripts/                   # Python scripts (PDF, email, report - server-side)
├── memory/                    # PRD and project docs
└── public/                    # Static assets (logo)
```

**Total source files**: 43 | **Total lines (lib + app)**: ~8,699

## 5. Entry Points

- **Main**: `app/page.js` -- SPA with hash routing, all page components
- **API**: `app/api/[[...path]]/route.js` -- Catch-all REST API
- **Dev**: `npm run dev` (Next.js dev server, port 3000, 512MB heap limit)
- **Build**: `npm run build`
- **Start**: `npm start`

## 6. API Surface

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | Health check |
| GET | `/auth/me` | Get current user profile |
| POST | `/auth/login-log` | Log auth events |
| GET | `/auth/logs` | Admin: view auth logs |
| GET | `/auth/session-timeout` | Get session timeout config |
| GET/PATCH | `/settings` | Platform settings CRUD |
| GET/POST | `/users` | List/create users |
| PATCH/DELETE | `/users/:id` | Update/deactivate user |
| GET/POST | `/projects` | List/create projects |
| GET/PATCH/DELETE | `/projects/:id` | Project CRUD |
| GET/PUT | `/projects/:id/screener` | Screener responses |
| POST | `/projects/:id/screener/submit` | Submit screener |
| GET/PUT | `/projects/:id/diagnostic` | Diagnostic responses |
| POST | `/projects/:id/diagnostic/submit` | Submit diagnostic + score |
| GET | `/projects/:id/scores` | Get scores (with optional recalc) |
| POST | `/projects/:id/link` | Generate assessment link |
| POST | `/projects/:id/link/send-email` | Email assessment link |
| GET/DELETE | `/projects/:id/link` | Get/expire link |
| GET | `/assess/:token` | Public: load assessment |
| PUT | `/assess/:token` | Public: save progress |
| POST | `/assess/:token/submit` | Public: submit assessment |
| GET | `/projects/:id/assessments` | List assessments |
| GET | `/projects/:id/scores/compare` | Compare scores across assessments |
| POST | `/projects/:id/reassess` | Create reassessment |
| GET | `/admin/stats` | Dashboard statistics |
| POST | `/admin/recalculate-scores/:id` | Recalculate project scores |
| GET | `/activity` | Activity log |
| GET | `/organization` | Org details |
| PATCH | `/organization/settings` | Update org settings |
| POST | `/projects/:id/report/generate` | Generate AI report |
| GET | `/projects/:id/report` | Get report data |
| GET | `/projects/:id/report/pdf` | Get PDF data |
| POST | `/notifications/send-report` | Email report link |
| POST | `/notifications/password-reset` | Send password reset |
| POST | `/notifications/send-pdf-report` | Email PDF report |

**Total endpoints detected**: ~45

## 7. Data Models

| Table | Purpose |
|-------|---------|
| `auth.users` | Supabase auth users |
| `auth.identities` | Auth provider identities |
| `profiles` | User profiles (name, role, active status) |
| `projects` | Client projects (company, industry, status, consultant) |
| `assessments` | Questionnaire responses, scores, reports (JSONB fields) |
| `questionnaire_links` | Tokenized public assessment links with expiry |
| `activity_log` | User activity tracking |
| `auth_logs` | Authentication event logs |
| `platform_settings` | Configurable platform parameters |
| `organizations` | Multi-tenant org data |

**Total tables**: 8 (public) + 2 (auth)

## 8. Auth & Security

- **Method**: Supabase Auth (email/password)
- **Server auth**: Service role key (bypasses RLS) for all API operations
- **Client auth**: Anon key for auth operations only (signIn, signUp, signOut)
- **Roles**: `admin` and `consultant` (stored in profiles table)
- **Session**: Client-side timeout tracking with configurable duration
- **Public access**: Token-based assessment links with expiry enforcement
- **Email validation**: Company email required for screener Q3 (free email domains blocked)
- **RLS**: Enabled on all tables but policies are minimal (API uses service role)

## 9. Configuration

### Environment Variables
| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side) |
| `ANTHROPIC_API_KEY` | Claude API key for report generation |
| `NEXT_PUBLIC_BASE_URL` | Base URL for link generation |

### Key Config Files
| File | Purpose |
|------|---------|
| `next.config.js` | CORS headers, image config |
| `tailwind.config.js` | Theme, colors, animations |
| `jsconfig.json` | Path aliases (@/) |
| `components.json` | shadcn/ui config |

## 10. Dependencies (Top 15)

| Package | Purpose |
|---------|---------|
| `next` | React framework |
| `@supabase/supabase-js` | Database & auth client |
| `@anthropic-ai/sdk` | Claude AI for reports |
| `jspdf` | Client-side PDF generation |
| `recharts` | Charts and visualizations |
| `lucide-react` | Icon library |
| `@radix-ui/*` | Headless UI primitives |
| `tailwindcss` | Utility-first CSS |
| `sonner` | Toast notifications |
| `uuid` | Token generation |
| `date-fns` | Date formatting |
| `zod` | Schema validation |
| `react-hook-form` | Form state management |
| `html2canvas` | Screenshot capture |
| `next-themes` | Dark/light mode |

## 11. Scripts / Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (port 3000, 512MB heap) |
| `npm run build` | Production build |
| `npm start` | Start production server |

## 12. Testing

- **Framework**: Playwright (e2e)
- **Test location**: `tests/e2e/`
- **Test count**: 5 spec files (core-flows, forgot-password, projects, scores-report, create-project)
- **Coverage**: Not configured
- **Config**: `tests/playwright.config.ts` (Chromium only, 60s timeout)

## 13. Deployment

- **Platform**: Vercel (inferred from URL patterns and base URL logic)
- **CI/CD**: Not detected (no `.github/workflows`)
- **Docker**: No
- **Preview URL**: `biz-ascend-rad.vercel.app`

## 14. Patterns & Conventions

- **Naming**: Files: PascalCase for components, camelCase for libs. Functions: camelCase
- **Error handling**: Try/catch with JSON error responses in API, toast notifications on client
- **Imports**: Path aliases (`@/lib/*`, `@/components/*`)
- **Code organization**: Mega-file pattern -- most logic in `app/page.js` and single API route
- **State management**: React useState/useEffect + TanStack Query for server state
- **Routing**: Hash-based client-side routing (no Next.js pages router)
- **API style**: REST with manual path matching in catch-all route
- **AI integration**: Structured output schemas with parallel section generation

## 15. Tech Debt & Observations

- **TODOs/FIXMEs**: 0
- **Mega-file risk**: `app/page.js` is 2838 lines containing 7+ page components -- difficult to maintain
- **Single API route**: 1130 lines with ~45 endpoints in one file -- should be split
- **Empty component dirs**: `components/auth/`, `components/projects/`, `components/scores/`, `components/dashboard/`, `components/users/` exist but are mostly empty -- pages still live in `app/page.js`
- **Legacy Python scripts**: `scripts/` directory contains Python files (generate_pdf.py, email_service.py) invoked via child_process from API route
- **RLS gap**: RLS enabled on all tables but most have no policies -- relying entirely on service role key
- **No CI/CD**: No automated testing or deployment pipeline detected
- **Package name mismatch**: `package.json` name is `nextjs-mongo-template` (template artifact)
- **MongoDB dep**: `mongodb` package in dependencies but not used (Supabase is the DB)
- **Large PDF generator**: `lib/generatePdf.js` at 2109 lines is the second largest file
- **Report agent complexity**: `lib/reportAgent.js` at 1508 lines with multiple Claude API calls and structured schemas

## 16. Quick Reference

| Task | Command |
|------|---------|
| Start dev | `npm run dev` |
| Build | `npm run build` |
| Start prod | `npm start` |
| Run e2e tests | `cd tests && npx playwright test` |
| Lint | Not configured |

---

*Generated by Prime Command. Re-run `/prime` to update.*
