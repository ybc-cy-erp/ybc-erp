# Global Release Report - YBC ERP

Date: 2026-03-05
Branch: `main`
Release commit candidate: `d53e688`

## 1) Full Module/Screen Checklist (Pass/Fail)

### Public screens
| Screen | Route | Status | Evidence |
|---|---|---|---|
| Login | `/login` | PASS | `docs/reports/screenshots/auth/login.png` |
| Sign Up | `/signup` | PASS | `docs/reports/screenshots/auth/signup.png` |
| Reset Password | `/reset-password` | PASS | `docs/reports/screenshots/auth/reset-password.png` |

### Private screens
| Screen | Route | Status | Evidence |
|---|---|---|---|
| Dashboard | `/dashboard` | PASS | `docs/reports/screenshots/dashboard/dashboard.png` |
| Membership Plans | `/membership-plans` | PASS | `docs/reports/screenshots/memberships/membership-plans.png` |
| Memberships | `/memberships` | PASS | `docs/reports/screenshots/memberships/memberships.png` |
| Membership Create | `/memberships/create` | PASS | `docs/reports/screenshots/memberships/memberships_create.png` |
| Events | `/events` | PASS | `docs/reports/screenshots/events/events.png` |
| Event Create | `/events/create` | PASS | `docs/reports/screenshots/events/events_create.png` |
| Bills | `/bills` | PASS | `docs/reports/screenshots/finance/bills.png` |
| Bill Create | `/bills/create` | PASS | `docs/reports/screenshots/finance/bills_create.png` |
| Wallets | `/wallets` | PASS | `docs/reports/screenshots/finance/wallets.png` |
| Counterparties | `/counterparties` | PASS | `docs/reports/screenshots/directories/counterparties.png` |
| Items | `/items` | PASS | `docs/reports/screenshots/directories/items.png` |
| Documents Hub | `/documents` | PASS | `docs/reports/screenshots/documents/documents.png` |
| Document Journal | `/document-journal` | PASS | `docs/reports/screenshots/documents/document-journal.png` |
| Cash Documents | `/cash-documents` | PASS | `docs/reports/screenshots/documents/cash-documents.png` |
| Chart of Accounts | `/chart-of-accounts` | PASS | `docs/reports/screenshots/finance/chart-of-accounts.png` |
| Currency Exchange | `/currency-exchange` | PASS | `docs/reports/screenshots/finance/currency-exchange.png` |
| Transfers | `/transfers` | PASS | `docs/reports/screenshots/finance/transfers.png` |
| Directories Tabs | `/directories` | PASS | `docs/reports/screenshots/directories/directories.png` |
| Finance Hub | `/finance` | PASS | `docs/reports/screenshots/finance/finance.png` |
| Accounts | `/accounts` | PASS | `docs/reports/screenshots/finance/accounts.png` |
| Users | `/users` | PASS | `docs/reports/screenshots/users/users.png` |
| Settings | `/settings` | PASS | `docs/reports/screenshots/settings/settings.png` |
| ERP Manual | `/manual` | PASS | `docs/reports/screenshots/manual/manual.png` |
| Reports Hub | `/reports` | PASS | `docs/reports/screenshots/reports/reports.png` |
| Profit & Loss | `/reports/profit-loss` | PASS | `docs/reports/screenshots/reports/reports_profit-loss.png` |
| Balance Sheet | `/reports/balance-sheet` | PASS | `docs/reports/screenshots/reports/reports_balance-sheet.png` |
| Cash Flow | `/reports/cash-flow` | PASS | `docs/reports/screenshots/reports/reports_cash-flow.png` |

Result source files:
- `docs/reports/screen-validation-public.json`
- `docs/reports/screen-validation-private.json`

## 2) Function-Level Checks Summary

Automated major-function smoke checks (6/6 PASS):
- Dashboard quick action -> membership create route.
- Finance hub navigation -> Accounts route.
- Documents hub navigation -> Document Journal route.
- Reports drilldown navigation -> Profit & Loss detail route.
- Directories tabs switching -> Users tab content.
- Users page invite modal open flow.

Result source:
- `docs/reports/function-checks.json`

## 3) Calculation Validation (Expected vs Actual)

| Test Case | Expected | Actual | Status |
|---|---|---|---|
| P&L totals (Jan 2026) | revenue=1500, expenses=350, net=1150 | revenue=1500, expenses=350, net=1150 | PASS |
| Balance Sheet equation (as of 2026-01-31) | assets=1550, liabilities=150, equity=1400 | assets=1550, liabilities=150, equity=1400 | PASS |
| Cash Flow (Jan 2026) | cash_beginning=250, net_change=1300, cash_ending=1550 | cash_beginning=250, net_change=1300, cash_ending=1550 | PASS |

Execution source:
- `npm test`
- `client/tests/calculations.test.mjs`

## 4) Bug Fixes Made

- Fixed invalid React hook usage and declaration-order runtime issues across multiple pages/components.
- Fixed report dashboard metric mapping bug in `ReportsPage` (`total_*` / `net_*` fields were not used).
- Added QA bypass auth mode (env-gated) for deterministic release validation and screenshot automation.
- Added deterministic financial calculation tests with explicit expected vs actual assertions.
- Added comprehensive screen screenshot smoke automation and function smoke automation scripts.
- Fixed `telegram_settings` loading to use `.maybeSingle()` (removed 406 noise on empty settings row).
- Fixed Supabase `users` RLS recursion by replacing recursive policies with JWT metadata-based policies.
  - Migration file: `supabase/migrations/014_fix_users_rls_recursion.sql`
  - Migration execution: applied to production Supabase on 2026-03-05.
- Added server ESLint flat config and workspace script fixes so lint/test/build are runnable end-to-end.

## 5) Deployment + Production Smoke

### Deployment actions executed
1. Pushed release commit to `main`: `d53e688` (auto-deploy trigger step).
2. Attempted manual Cloudflare Pages deploy via existing command:
   - `npx wrangler pages deploy client/dist --project-name=ybc-erp --branch=main`
   - Blocked: missing `CLOUDFLARE_API_TOKEN` in non-interactive environment.

### Production smoke results (current live production)
- Base URL: `https://erp.ybc.com.cy`
- Checks: 3/3 PASS
  - Home loads
  - Login form present
  - Private route (`/dashboard`) redirects to login when unauthenticated
- Result file: `docs/reports/production-smoke.json`
- Evidence:
  - `docs/reports/screenshots/production/prod-home.png`
  - `docs/reports/screenshots/production/prod-login.png`
  - `docs/reports/screenshots/production/prod-dashboard-redirect.png`

## 6) Residual Risks / Blockers

- Blocker: Manual production deploy from this environment cannot complete without `CLOUDFLARE_API_TOKEN`.
- Risk: `erp.ybc.com.cy` currently serves bundle `index-D1IZLyJk.js`; this does not match local release build hash (`index-DIGLZrtO.js`), so latest commit deployment is not yet externally verifiable.
- Non-blocking quality note: 22 `react-hooks/exhaustive-deps` warnings remain (lint passes; no current failing behavior observed in smoke checks).

## 7) Exact Screenshot Evidence Paths

All evidence is under:
- `docs/reports/screenshots/auth/`
- `docs/reports/screenshots/dashboard/`
- `docs/reports/screenshots/directories/`
- `docs/reports/screenshots/documents/`
- `docs/reports/screenshots/events/`
- `docs/reports/screenshots/finance/`
- `docs/reports/screenshots/manual/`
- `docs/reports/screenshots/memberships/`
- `docs/reports/screenshots/reports/`
- `docs/reports/screenshots/settings/`
- `docs/reports/screenshots/users/`
- `docs/reports/screenshots/production/`

