# YBC ERP - Product Vision

## Mission
Створити повноцінну ERP-систему управлінського обліку для YBC Business Club (кіпрський філіал), що автоматизує членство, події, фінанси та криптовалютні операції.

## Success Metrics

### Launch Milestone
- **Go-Live Date:** End of Week 11 (May 2026)
- **Production-Ready:** All core modules functional, tested, and deployed
- **User Training:** YBC Cyprus staff trained and onboarded

### Adoption
- **Daily Active Usage:** 100% of YBC Cyprus staff use system daily
- **Data Migration:** All ongoing memberships and events in system within first week
- **User Satisfaction:** Positive feedback from Owner and Accountant

### Accuracy & Compliance
- **Zero Accounting Errors:** First month in production with no discrepancies
- **IFRS Compliant:** Chart of accounts and double-entry bookkeeping follow standards
- **Audit Trail:** 100% of financial transactions logged and traceable

### Performance
- **API Response Time:** <200ms (p95) for all endpoints
- **Page Load Time:** <2s (p95) for all pages
- **Uptime:** 99.9% availability (max 43 minutes downtime per month)

### Business Impact
- **Time Savings:** 50% reduction in manual accounting work
- **Revenue Visibility:** Real-time MRR and revenue metrics
- **Compliance:** Weekly royalty reports to parent YBC automated

## Core Values

### 1. Ukrainian-First
- **Весь UI на українській мові** - no English leakage
- Clear, professional business terminology
- Accessible to all Ukrainian-speaking staff

### 2. Automation
- **Деловой approach** - minimize manual work
- Real-time sync (Google Sheets, Telegram notifications)
- Automated revenue recognition (daily calculation)
- Auto-generated journal entries (double-entry bookkeeping)

### 3. Transparency
- **Full Audit Log** - every action tracked
- Real-time data visibility
- Clear financial reports
- No black-box calculations

### 4. Compliance
- **Accrual Accounting** - expenses by service date, payments by cash date
- **Double-Entry Bookkeeping** - every transaction balanced
- **IFRS Standards** - chart of accounts (100-599)
- **Multi-tenant Security** - RLS ensures data isolation

### 5. Security
- **Row Level Security (RLS)** - database-level tenant isolation
- **No PII in Logs** - privacy protected
- **Secrets in Env Vars** - no hardcoded credentials
- **HTTPS Only** - encrypted communication

## User Personas

### 1. Owner (Олег)
- **Role:** Strategic decision-making, full system access
- **Needs:**
  - Real-time revenue metrics (MRR, churn rate)
  - Expiring memberships visibility (30/14/7/3 days)
  - Weekly royalty calculation (10% to parent YBC)
  - Multi-currency wallet balances
  - Full financial reports (P&L, Balance Sheet)
- **Pain Points:** Manual spreadsheets, no real-time data, error-prone calculations

### 2. Accountant
- **Role:** Financial compliance, reporting, audit
- **Needs:**
  - Read-only access to all financial data
  - Generate reports (revenue, expenses, balances)
  - Verify journal entries (double-entry correctness)
  - Export data for external reporting
- **Pain Points:** Data scattered across systems, manual reconciliation

### 3. Manager
- **Role:** Daily operations, cash register management
- **Needs:**
  - Record transactions (cash, crypto)
  - View own cash register balance
  - Simple interface for quick entry
- **Pain Points:** Complex systems, too many permissions needed

### 4. Event Manager
- **Role:** Create events, sell tickets, manage attendance
- **Needs:**
  - Easy event creation
  - Ticket sales tracking
  - Revenue visibility per event
- **Pain Points:** No dedicated tool, manual tracking in spreadsheets

### 5. Cashier
- **Role:** Transaction entry only
- **Needs:**
  - Fast payment recording
  - Clear confirmation of success
  - No access to sensitive data
- **Pain Points:** Slow systems, unclear if payment recorded

### 6. Analyst
- **Role:** Reports and analytics only
- **Needs:**
  - View dashboards
  - Generate custom reports
  - No ability to modify data
- **Pain Points:** No self-service analytics, waiting on others for reports

## Key Features (11-Week Roadmap)

### Week 1: Core Foundation
- Authentication (JWT, secure login)
- Tenant management (multi-tenant architecture)
- User management (CRUD, role assignment)
- Basic dashboard

### Week 2: Membership Management
- Membership plans (monthly, quarterly, annual, lifetime, custom daily rate)
- Membership CRUD (create, renew, cancel)
- Freeze logic (pause revenue, extend duration)
- Daily revenue recognition (on-the-fly calculation)

### Week 3: Events & Tickets
- Event creation (name, date, description)
- Ticket types (price, quantity)
- Ticket sales (linked to users or external clients)
- Revenue recognition on event date

### Week 4: Chart of Accounts & Journal Entries
- IFRS chart of accounts (100-599)
- Manual journal entries
- Auto-generated entries (from payments, sales)
- Balance verification (debits = credits)

### Week 5: Bills & Accrual Accounting
- Bill creation (vendor, service date, amount)
- Expense recognition on bill_date (accrual)
- Bill payment (cash outflow on payment_date)
- Accounts payable tracking

### Week 6: Invoices & Receivables
- Invoice creation (client, issue date, due date)
- Revenue recognition on invoice date
- Invoice payment (cash inflow)
- Accounts receivable tracking

### Week 7: Multi-Currency Wallets
- Wallet creation (EUR, USD, USDT, BTC, etc.)
- 6 crypto networks (Ethereum, BSC, Tron, Bitcoin, Arbitrum, Optimism)
- Deposit/withdrawal transactions
- Balance tracking per currency
- Real-time crypto rates (CoinGecko API)

### Week 8: Reports & Analytics
- Dashboard metrics (MRR, active members, churn rate)
- Expiring memberships table (color-coded by urgency)
- Profit & Loss statement
- Balance Sheet
- Cash Flow statement
- Revenue by source (memberships vs events)

### Week 9: Budget Module
- Budget categories (expenses)
- Monthly budget limits
- Overspend alerts (Telegram notifications)
- Budget vs actual reports

### Week 10: Integrations
- **Telegram Bot:**
  - Per-transaction notifications (by tenant)
  - Client bot (invite, status check, renew, buy tickets)
- **Google Sheets Sync:**
  - Real-time sync (15 columns)
  - Automatic row insertion on new transaction

### Week 11: Testing, Optimization, Deployment
- Full regression testing
- Performance optimization (<200ms API, <2s page load)
- Security audit
- Production deployment
- User training
- Go-live

## Non-Goals (Out of Scope)

### 1. Legacy Data Import
- **Decision:** Start from scratch, no old data migration
- **Reason:** Clean slate, avoid data quality issues

### 2. Mobile Native Apps
- **Decision:** Web-first, responsive design
- **Reason:** Faster development, single codebase

### 3. Inventory Management
- **Reason:** Not needed for YBC business model (services, not products)

### 4. HR/Payroll Features
- **Reason:** Separate system, out of scope for ERP

### 5. Advanced Crypto Features
- **Scope:** Balance tracking, transaction recording only
- **Not Included:** Trading, DeFi integrations, complex crypto operations

## Success Criteria

### Per Sprint
- All tasks completed with `QA PASS`
- No critical or high bugs open
- Documentation updated
- Deployed to staging and tested

### Per Milestone (Module)
- Full module functional in production
- Integration tests passing
- User-facing features in Ukrainian
- Performance benchmarks met
- Real user testing completed

### Final Launch (Week 11)
- All 11 modules deployed and working
- Zero critical bugs
- User training completed
- Positive feedback from YBC Cyprus team
- Seamless transition from old system (if any)
- First week of real usage successful

## Risks & Mitigation

### Technical Risks
- **Risk:** Crypto API rate limits
- **Mitigation:** Cache data, use multiple API providers, implement retry logic

- **Risk:** Database performance degradation
- **Mitigation:** Proper indexing, query optimization, Supabase scaling

### Business Risks
- **Risk:** User resistance to new system
- **Mitigation:** Early user involvement, training, phased rollout

- **Risk:** Scope creep
- **Mitigation:** Strict 11-week roadmap, defer nice-to-haves to post-launch

### Security Risks
- **Risk:** Data breach, cross-tenant access
- **Mitigation:** RLS enforced, security audit, penetration testing

## Long-Term Vision (Post-Launch)

### Phase 2 (Q3 2026)
- Mobile app (React Native)
- Advanced analytics (custom dashboards, data export)
- Integration with parent YBC system (API)
- Multi-language support (English, Russian)

### Phase 3 (Q4 2026)
- Other YBC branches onboarded
- White-label version for other business clubs
- Advanced crypto features (DeFi tracking, NFT memberships)

---

**Document Version:** 1.0  
**Last Updated:** 2026-03-01  
**Owner:** Orchestrator Agent  
**Status:** Approved
