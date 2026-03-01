# TASKS - YBC ERP Development Roadmap

**Status:** Week 1/11 - Core Foundation  
**Updated:** 2026-03-01

---

## Week 1: Core Foundation (Current) ⏳

### Setup & Infrastructure
- [x] GitHub organization created (`ybc-cy-erp`)
- [x] GitHub repository created (`ybc-erp`)
- [x] Supabase project created (`ybc-erp`)
- [x] Agent structure created (orchestrator, architect, backend_dev, frontend_dev, qa_engineer)
- [x] Artifacts created (VISION, TASKS, BUGS, TEST_PLAN, SECURITY)
- [ ] Railway project setup
- [ ] Environment variables configured
- [ ] CI/CD basic pipeline

### Database
- [ ] Database schema migration (25 tables)
- [ ] RLS policies setup
- [ ] Test data seeding (optional)

### Backend
- [ ] Node.js project structure (`server/`)
- [ ] Express API setup
- [ ] Supabase client integration
- [ ] Audit logging middleware
- [ ] Health check endpoint (`/health`)

### Frontend
- [ ] React project structure (`client/`)
- [ ] Design System CSS (theme.css, glassmorphism.css)
- [ ] Ukrainian localization setup (i18n)
- [ ] Basic layout (Navbar, Sidebar)
- [ ] Theme switcher (Light/Dark)

### QA
- [ ] Test plan for Week 1
- [ ] Smoke tests (backend health, frontend loads)
- [ ] QA PASS sign-off

---

## Week 2: Authentication & Multi-Currency Wallets

- [ ] Supabase Auth setup
- [ ] Login/Register UI
- [ ] JWT token handling
- [ ] Wallets CRUD (multi-currency)
- [ ] Wallet balance tracking

---

## Week 3: Membership Management

- [ ] Membership plans CRUD
- [ ] Membership purchase flow
- [ ] Revenue recognition logic (on-the-fly calculation)
- [ ] Membership refunds (proportional)
- [ ] Dashboard: expiring memberships table

---

## Week 4: Crypto Wallets & Integration

- [ ] Crypto wallets specific logic
- [ ] Moralis API integration
- [ ] TronGrid API integration
- [ ] Blockchain.info API integration
- [ ] Balance check automation (cron)
- [ ] Mismatch detection & alerts

---

## Week 5: Events, Tickets & Bills

- [ ] Events CRUD
- [ ] Ticket types & sales
- [ ] Deferred revenue for events
- [ ] Event refunds (reversal)
- [ ] Capacity control
- [ ] Bills CRUD (accrual accounting)
- [ ] Payment matching to bills
- [ ] Bill status workflow (draft → approved → paid)

---

## Week 6: Transactions, Chart of Accounts & Period Closing

- [ ] Chart of accounts setup (IFRS structure)
- [ ] Manual transaction entry (double-entry)
- [ ] Transaction list & filters
- [ ] Basic P&L report
- [ ] Period closing mechanism
- [ ] Audit log UI (view history)

---

## Week 7: Telegram Notifications

- [ ] Telegram bot setup
- [ ] Notification on every transaction
- [ ] Alert types (balance mismatch, expiring memberships, etc.)
- [ ] Telegram bot for clients (invite, status check)

---

## Week 8: Google Sheets & Reports

- [ ] Google Sheets API integration
- [ ] Real-time sync on transaction create
- [ ] P&L report
- [ ] Balance Sheet report
- [ ] Cash Flow report
- [ ] Export to PDF/Excel

---

## Week 9: Budget Module

- [ ] Budgets CRUD
- [ ] Budget lines (by accounts)
- [ ] Actual vs Plan comparison
- [ ] Budget alerts (>10% overspend)
- [ ] Scenario planning
- [ ] Budget performance dashboard

---

## Week 10: Royalty & Multi-tenant

- [ ] Royalty calculation automation (10% every Friday)
- [ ] Multi-tenant support (parent + children tenants)
- [ ] Consolidated reporting for parent tenant
- [ ] Branch visibility settings
- [ ] Revolut Business CSV import (optional)

---

## Week 11: Polish & Launch

- [ ] ZOHO CRM integration
- [ ] Calendar sync (Google, Apple)
- [ ] User roles & permissions refinement
- [ ] Audit log полировка
- [ ] Final testing & bug fixes
- [ ] Custom domain setup (erp.ybc.com.cy)
- [ ] Deployment to Railway
- [ ] Documentation (українською)

---

## Notes

- Each week ends with **QA PASS** before moving to next
- If QA FAIL → fix bugs and retest
- Update this file after each completed task
- Use `[ ]` for pending, `[x]` for completed
