# 🧠 Prime Summary: Biz Ascend RAD™

> Generated on: 2026-03-13
> Analyzer: Claude Code — Prime Command

---

## 1. Project Overview

- **Name**: Biz Ascend RAD™ (Revenue Acceleration Diagnostic)
- **Description**: B2B growth consulting platform where consultants diagnose, score, and accelerate client revenue growth systems. Features questionnaire-based assessments, AI-powered report generation, and PDF exports.
- **Type**: Web App (Full-stack)
- **Language**: JavaScript (ES6+), Python (scripts)
- **Framework**: Next.js 14
- **License**: Private

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | - |
| Framework | Next.js | 14.2.35 |
| UI Library | React | ^18 |
| Database | Supabase (PostgreSQL) | - |
| ORM/Client | @supabase/supabase-js | ^2.49.0 |
| Auth | Supabase Auth | via @supabase/ssr ^0.6.0 |
| State/Data | TanStack Query | ^5.62.0 |
| UI Components | shadcn/ui (Radix primitives) | new-york style |
| Styling | Tailwind CSS | ^3.4.1 |
| Charts | Recharts | ^2.15.3 |
| 3D | Three.js / R3F | ^0.183.2 |
| AI | Anthropic Claude SDK | ^0.78.0 |
| PDF | jspdf (client) + WeasyPrint (server/Python) | - |
| Forms | react-hook-form + zod | ^7.58.1 / ^3.25.67 |
| Testing | Playwright (E2E) | - |

## 3. Architecture

**Pattern**: Monolith
**Style**: Page-centric with hash-based client routing

### Request Lifecycle
1. Client uses hash-based router (`#/dashboard`, `#/projects`, etc.) in `app/page.js`
2. API calls go through `apiFetch()` helper → `/api/[[...path]]/route.js` (single catch-all API route)
3. API route handles auth via Supabase JWT, routes to appropriate handler by path pattern
4. Supabase PostgreSQL for persistence; demo mode uses mock data from `lib/mockData.js`
5. AI reports generated via Anthropic Claude SDK (`lib/reportAgent.js`)
6. PDF generation via Python scripts (WeasyPrint) or client-side jspdf

### Key Decisions
- **Hash-based routing** instead of Next.js file-based routing — entire SPA in single `page.js`
- **Single catch-all API route** (`app/api/[[...path]]/route.js`, 843 lines) handles all endpoints
- **Demo mode** allows full UI exploration with mock data, no Supabase required
- **Component extraction** partially done — dashboard, projects, auth, scores moved to `/components/`
- **Python scripts** for server-side PDF generation and email (WeasyPrint, Resend API)

## 4. Directory Structure

```
├── app/
│   ├── page.js              # Main SPA entry (~2000+ lines, hash router)
│   ├── layout.js             # Root layout
│   ├── providers.js          # Theme + QueryClient providers
│   ├── globals.css           # Tailwind + custom styles
│   └── api/[[...path]]/
│       └── route.js          # Monolithic API (843 lines)
├── components/
│   ├── ui/                   # shadcn/ui primitives (40+ components)
│   ├── auth/                 # LoginPage
│   ├── dashboard/            # DashboardPage
│   ├── projects/             # ProjectsList, ProjectDetail, CreateProject
│   ├── scores/               # ScoresPage
│   ├── users/                # AdminUsersPage
│   ├── layout/               # AppShell (sidebar)
│   └── shared/               # Context, ui-helpers
├── lib/
│   ├── constants.js          # Industries, pillars, bands, questions
│   ├── mockData.js           # Demo mode data
│   ├── supabase.js           # Supabase client init
│   ├── reportAgent.js        # Claude AI report generation
│   ├── generatePdf.js        # Client-side PDF generation
│   └── utils.js              # Helpers (cn, getMaturityBand)
├── scripts/
│   ├── generate_report.py    # Server-side AI report generation
│   ├── generate_pdf.py       # WeasyPrint PDF generation
│   └── email_service.py      # Resend email service
├── hooks/                    # Custom React hooks
├── migrations/               # SQL migration files (2)
├── tests/e2e/                # Playwright E2E tests (5 spec files)
├── specs/                    # Feature specs and plans
└── memory/                   # PRD and project memory
```

## 5. Entry Points

- **Main**: `app/page.js` — SPA with hash router, auth context, all page views
- **Dev**: `npm run dev` (or `yarn dev`) — Next.js dev server on port 3000
- **Build**: `npm run build` — Next.js production build
- **Test**: Playwright (`tests/playwright.config.ts`)

## 6. API Surface

All endpoints handled in `app/api/[[...path]]/route.js`:

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/auth/me | Current user profile |
| GET | /api/projects | List projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Project detail |
| PATCH | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Archive project |
| GET/PUT | /api/projects/:id/screener | Screener responses |
| POST | /api/projects/:id/screener/submit | Submit screener |
| GET/PUT | /api/projects/:id/diagnostic | Diagnostic responses |
| POST | /api/projects/:id/diagnostic/submit | Submit diagnostic |
| GET | /api/projects/:id/scores | Calculated scores |
| POST | /api/projects/:id/report/generate | Generate AI report |
| GET | /api/projects/:id/report | Get report |
| GET | /api/projects/:id/report/pdf | Download PDF |
| POST | /api/notifications/send-report | Send report email |
| POST | /api/notifications/password-reset | Password reset email |
| POST | /api/notifications/send-pdf-report | Send PDF to client |
| GET/PATCH | /api/organization | Organization settings |
| GET/POST/PATCH | /api/users | User management (admin) |
| GET | /api/admin/stats | Platform statistics |
| GET/PUT/POST | /api/assess/:token | Public assessment |

**Total endpoints detected**: ~25

## 7. Data Models

| Model | Table | Key Fields |
|-------|-------|------------|
| Profile | profiles | id, auth_id, email, name, role (admin/consultant) |
| Project | projects | id, company_name, industry, status, consultant_id |
| Assessment | assessments | id, project_id, assessment_number, screener/diagnostic status & responses, scores, report_data |
| Questionnaire Link | questionnaire_links | id, project_id, token, status, progress |
| Activity Log | activity_log | (tracking user actions) |
| Organization | organizations | (multi-tenant, from migration 002) |

**Total models detected**: 6

## 8. Auth & Security

- **Method**: Supabase Auth (email/password), JWT tokens
- **Auth flow**: Login → Supabase session → JWT passed in Authorization header to API
- **Roles**: admin, consultant (role-based access)
- **Demo mode**: Bypasses auth entirely with mock data
- **CORS**: Configurable via `CORS_ORIGINS` env var
- **Security headers**: X-Frame-Options: SAMEORIGIN

## 9. Configuration

### Environment Variables Detected
| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server) |
| `ANTHROPIC_API_KEY` | Claude AI API key |
| `NEXT_PUBLIC_BASE_URL` | App base URL |
| `CORS_ORIGINS` | Allowed CORS origins |

### Key Config Files
| File | Purpose |
|------|---------|
| `next.config.js` | Next.js config (images, CORS headers) |
| `tailwind.config.js` | Tailwind theme config |
| `jsconfig.json` | Path aliases (@/) |
| `components.json` | shadcn/ui config (new-york style) |
| `postcss.config.js` | PostCSS config |

## 10. Dependencies (Top 15)

| Package | Purpose |
|---------|---------|
| next | React framework (SSR, API routes) |
| react / react-dom | UI library |
| @supabase/supabase-js | Database & auth client |
| @tanstack/react-query | Server state management |
| @anthropic-ai/sdk | Claude AI integration |
| recharts | Data visualization charts |
| jspdf | Client-side PDF generation |
| react-hook-form + zod | Form handling + validation |
| tailwindcss | Utility-first CSS |
| lucide-react | Icon library |
| @tanstack/react-table | Data tables |
| next-themes | Dark/light mode |
| three / @react-three/fiber | 3D graphics (login page) |
| sonner | Toast notifications |
| axios | HTTP client |

## 11. Scripts / Commands

| Command | Purpose |
|---------|---------|
| `yarn dev` | Start dev server (port 3000, 512MB heap) |
| `yarn build` | Production build |
| `yarn start` | Start production server |
| `yarn dev:no-reload` | Dev without memory limit |

## 12. Testing

- **Framework**: Playwright (E2E)
- **Test location**: `tests/e2e/`
- **Test files**: 5 spec files (core-flows, projects, scores-report, forgot-password, create-project)
- **Config**: `tests/playwright.config.ts`
- **Unit tests**: Not detected

## 13. Deployment

- **Platform**: Emergent Agent (preview URLs seen in PRD)
- **CI/CD**: Not detected (no `.github/workflows/`)
- **Docker**: Not detected
- **Emergent config**: `.emergent/emergent.yml`

## 14. Patterns & Conventions

- **Naming**: Files: PascalCase for components, camelCase for lib; kebab-case for UI primitives
- **Components**: shadcn/ui pattern — primitives in `components/ui/`, features in `components/{domain}/`
- **State**: TanStack Query for server state, React useState for local
- **Routing**: Hash-based SPA routing (not Next.js file routing)
- **Styling**: Tailwind CSS with `cn()` utility for conditional classes
- **Theme**: Dark mode (black + orange) / Light mode (colorful cards) via next-themes
- **Exports**: Barrel exports via `index.js` in each component directory
- **API**: Single catch-all route with path parsing

## 15. Tech Debt & Issues

- **TODOs/FIXMEs**: 0
- **Monolithic `page.js`**: Main SPA file is very large (~2000+ lines), partial extraction to components done
- **Monolithic API route**: 843-line single file handles all endpoints — should be split
- **No unit tests**: Only E2E tests via Playwright
- **No CI/CD pipeline**: No GitHub Actions or similar detected
- **Demo mode coupling**: Demo mode logic interleaved with real API logic
- **Python script execution**: API route shells out to Python scripts via `child_process.exec` — potential security concern with input handling

## 16. Quick Reference

| Task | Command |
|------|---------|
| Start dev | `yarn dev` |
| Run tests | `cd tests && npx playwright test` |
| Build | `yarn build` |
| Lint | Not configured |

## 17. Gotchas & Notes

- [2026-03-13] Chore: Delete Project — Added permanent delete button (admin-only) to project detail page with confirmation dialog, alongside existing archive feature.

---

*Generated by Prime Command. Re-run `/prime` to update.*
