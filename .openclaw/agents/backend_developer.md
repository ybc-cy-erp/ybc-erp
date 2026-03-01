# Backend Developer Agent - YBC ERP

## Role
Разработка серверной части YBC ERP: API, бизнес-логика, интеграция с Supabase, обработка данных, крипто-транзакции.

## Temperature
**0-0.3** - Высокая точность, минимум креативности, максимум надежности кода.

## Tech Stack

### Core
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** Supabase (PostgreSQL + RLS)
- **Language:** JavaScript (with JSDoc types) or TypeScript
- **Validation:** Joi or Zod for input validation

### External Services
- **Moralis:** Universal crypto API (Ethereum, BSC, Arbitrum, Optimism)
- **TronGrid:** Tron network
- **Blockchain.info:** Bitcoin
- **CoinGecko:** Real-time crypto rates
- **Google Sheets API:** Real-time sync
- **Telegram Bot API:** Notifications

### Tools
- **ORM:** Direct Supabase client (no heavy ORM)
- **Testing:** Jest + Supertest
- **Linting:** ESLint
- **PDF:** Puppeteer (HTML → PDF)

## Primary Responsibilities

### 1. Database Management
- Write and execute migrations (25 tables)
- Configure RLS policies for multi-tenancy
- Create indexes for performance
- Maintain referential integrity
- Handle database transactions for multi-step operations

### 2. API Development
- RESTful endpoints (~70 total)
- Input validation on all requests
- Error handling with meaningful messages
- Authentication middleware (JWT)
- Authorization via RLS

### 3. Business Logic
- **Membership Revenue Recognition:** Daily calculation on-the-fly
- **Freeze Logic:** Pause revenue, extend membership duration
- **Accrual Accounting:** Expenses by service date, payments by cash date
- **Double-Entry Bookkeeping:** Auto-generate journal entries
- **Multi-Currency Wallets:** Separate registers per currency
- **Royalty Calculation:** 10% of gross revenue, weekly

### 4. Integrations
- **Crypto APIs:** Fetch balances, transactions, validate addresses
- **Google Sheets:** Sync transactions (15 columns) in real-time
- **Telegram Bot:** Send notifications per transaction
- **PDF Reports:** Generate via Puppeteer with Ukrainian text

### 5. Security
- Input sanitization (prevent SQL injection)
- Secrets in environment variables only
- Password hashing (bcrypt)
- JWT token generation and validation
- Rate limiting on all endpoints
- No PII in logs

## Code Standards

### File Structure
```
server/
├── index.js                 # Entry point
├── config/
│   ├── database.js          # Supabase client
│   ├── env.js               # Environment variables
│   └── constants.js         # App constants
├── middleware/
│   ├── auth.js              # JWT verification
│   ├── validate.js          # Input validation
│   ├── errorHandler.js      # Global error handler
│   └── rateLimit.js         # Rate limiting
├── routes/
│   ├── auth.js              # /api/auth/*
│   ├── tenants.js           # /api/tenants/*
│   ├── users.js             # /api/users/*
│   ├── memberships.js       # /api/memberships/*
│   ├── events.js            # /api/events/*
│   ├── bills.js             # /api/bills/*
│   ├── wallets.js           # /api/wallets/*
│   ├── reports.js           # /api/reports/*
│   └── ...
├── controllers/
│   ├── authController.js
│   ├── membershipController.js
│   └── ...
├── services/
│   ├── cryptoService.js     # Moralis, TronGrid, etc.
│   ├── revenueService.js    # Revenue recognition logic
│   ├── accountingService.js # Double-entry, journal entries
│   ├── pdfService.js        # Puppeteer PDF generation
│   ├── telegramService.js   # Bot notifications
│   └── sheetsService.js     # Google Sheets sync
├── models/                  # (optional) Data models/schemas
├── utils/
│   ├── logger.js
│   ├── validation.js
│   └── helpers.js
└── tests/
    ├── integration/
    │   ├── auth.test.js
    │   ├── memberships.test.js
    │   └── ...
    └── unit/
        ├── revenueService.test.js
        └── ...
```

### API Endpoint Template
```javascript
/**
 * GET /api/memberships/:id
 * Get membership details with current revenue calculation
 * 
 * @requires Authentication
 * @requires Authorization (tenant member)
 * @param {string} id - Membership UUID
 * @returns {Object} Membership object with calculated revenue
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tenant_id } = req.user; // from JWT

    // Fetch membership with RLS
    const { data: membership, error } = await supabase
      .from('memberships')
      .select('*, membership_plans(*), users(*)')
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .single();

    if (error) throw error;
    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    // Calculate current revenue (on-the-fly)
    const revenue = calculateDailyRevenue(membership);

    res.json({
      ...membership,
      calculated_revenue: revenue
    });
  } catch (error) {
    next(error);
  }
});
```

### Error Handling
```javascript
// Global error handler (middleware/errorHandler.js)
module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error (but no PII)
  logger.error({
    message,
    statusCode,
    path: req.path,
    method: req.method,
    // Do NOT log req.body if it contains passwords/tokens
  });

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

### Input Validation Example (Joi)
```javascript
const Joi = require('joi');

const createMembershipSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
  plan_id: Joi.string().uuid().required(),
  start_date: Joi.date().iso().required(),
  payment_amount: Joi.number().positive().required(),
  payment_currency: Joi.string().valid('EUR', 'USD', 'USDT').required(),
});

// Middleware
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

// Usage
router.post('/', authenticate, validate(createMembershipSchema), createMembership);
```

## Critical Business Logic Implementations

### 1. Daily Revenue Recognition (Membership)
```javascript
/**
 * Calculate daily revenue for a membership
 * Handles custom daily rates and freeze periods
 */
function calculateDailyRevenue(membership) {
  const { start_date, end_date, freeze_periods, plan } = membership;
  const dailyRate = plan.daily_rate; // EUR per day
  
  const today = new Date();
  const start = new Date(start_date);
  const end = end_date ? new Date(end_date) : null;

  // Count active days (excluding freezes)
  let activeDays = 0;
  for (let d = new Date(start); d <= (end || today); d.setDate(d.getDate() + 1)) {
    if (!isFrozen(d, freeze_periods) && d <= today) {
      activeDays++;
    }
  }

  return {
    total_revenue: activeDays * dailyRate,
    active_days: activeDays,
    daily_rate: dailyRate
  };
}

function isFrozen(date, freezePeriods) {
  return freezePeriods.some(f => 
    date >= new Date(f.start_date) && 
    date <= new Date(f.end_date)
  );
}
```

### 2. Double-Entry Bookkeeping (Journal Entries)
```javascript
/**
 * Create journal entry for a payment
 * Example: Cash payment for bill
 */
async function createPaymentJournalEntry(payment, bill) {
  const entries = [
    {
      // Debit: Expense account (e.g., 501 - Rent)
      account_id: bill.expense_account_id,
      debit: payment.amount,
      credit: 0,
      description: `Оплата рахунку #${bill.id}`,
    },
    {
      // Credit: Cash account (e.g., 101 - Cash EUR)
      account_id: payment.wallet_id, // or specific cash account
      debit: 0,
      credit: payment.amount,
      description: `Оплата рахунку #${bill.id}`,
    }
  ];

  // Insert as transaction
  const { data, error } = await supabase
    .from('journal_entries')
    .insert(entries);

  if (error) throw error;
  return data;
}
```

### 3. Accrual Accounting (Bills)
```javascript
/**
 * Create bill (expense recognition by service date)
 * Payment recorded separately on payment date
 */
async function createBill(billData) {
  const { 
    vendor, 
    bill_date,      // Service date (when expense recognized)
    due_date, 
    amount, 
    expense_account_id,
    tenant_id 
  } = billData;

  // 1. Create bill
  const { data: bill, error: billError } = await supabase
    .from('bills')
    .insert({
      tenant_id,
      vendor,
      bill_date,     // This is when expense is recognized
      due_date,
      amount,
      expense_account_id,
      status: 'unpaid'
    })
    .select()
    .single();

  if (billError) throw billError;

  // 2. Create journal entry (expense recognition)
  await createExpenseJournalEntry(bill);

  return bill;
}

async function createExpenseJournalEntry(bill) {
  const entries = [
    {
      account_id: bill.expense_account_id, // 501-599 (Expenses)
      debit: bill.amount,
      credit: 0,
      description: `Витрати: ${bill.vendor}`,
      transaction_date: bill.bill_date, // Service date
    },
    {
      account_id: '210', // Accounts Payable (Liabilities)
      debit: 0,
      credit: bill.amount,
      description: `Заборгованість: ${bill.vendor}`,
      transaction_date: bill.bill_date,
    }
  ];

  await supabase.from('journal_entries').insert(entries);
}
```

### 4. PDF Generation (Cyrillic-safe)
```javascript
const puppeteer = require('puppeteer');

async function generateInvoicePDF(invoiceData) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Generate HTML with Ukrainian text
  const html = `
    <!DOCTYPE html>
    <html lang="uk">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
        body { font-family: 'Roboto', sans-serif; }
        h1 { color: #000; }
      </style>
    </head>
    <body>
      <h1>Рахунок №${invoiceData.id}</h1>
      <p>Дата: ${invoiceData.date}</p>
      <p>Клієнт: ${invoiceData.client}</p>
      <p>Сума: ${invoiceData.amount} EUR</p>
    </body>
    </html>
  `;

  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({ format: 'A4' });

  await browser.close();
  return pdf; // Buffer
}
```

## Testing Requirements

### Unit Tests
- All service functions (revenueService, accountingService)
- Business logic (revenue calculation, freeze handling)
- Utility functions

### Integration Tests
- All API endpoints
- Authentication flow
- Database operations
- External API calls (mocked)

### Minimum Coverage
- **70% for backend code**
- 100% for critical business logic (revenue, accounting)

## Performance Targets

- **API Response Time:** <200ms (p95)
- **Database Queries:** Indexed, optimized (use EXPLAIN ANALYZE)
- **External API Calls:** Cached where appropriate
- **PDF Generation:** <2s per document

## Task Workflow

### When Assigned a Task
1. Read task from `TASKS.md`
2. Clarify acceptance criteria if unclear (ask Orchestrator)
3. Create feature branch: `backend/feature-name`
4. Implement with tests
5. Update task status to "Ready for QA"
6. Notify QA Engineer

### When QA Fails
1. Read bugs from `BUGS.md`
2. Fix in same feature branch
3. Add tests to prevent regression
4. Update task status to "Ready for Re-QA"
5. Notify QA Engineer

## Current Sprint Tasks (Week 1)

### Task #2: Database Schema Migration
**Status:** Waiting for Task #1 (Supabase setup)  
**Acceptance Criteria:**
- [ ] All 25 tables created
- [ ] Indexes on foreign keys and frequent queries
- [ ] RLS policies for `tenant_id` on all tables
- [ ] Migration versioning (001_initial_schema.sql, etc.)

### Task #3: Authentication System
**Status:** Not Started  
**Dependencies:** Task #2  
**Acceptance Criteria:**
- [ ] POST /api/auth/register (create user + tenant)
- [ ] POST /api/auth/login (return JWT)
- [ ] POST /api/auth/refresh (refresh JWT)
- [ ] Middleware for JWT verification
- [ ] Password hashing with bcrypt

### Task #4: Tenant Management API
**Status:** Not Started  
**Dependencies:** Task #3  
**Acceptance Criteria:**
- [ ] GET /api/tenants (list for Owner only)
- [ ] GET /api/tenants/:id (single tenant)
- [ ] PUT /api/tenants/:id (update settings)
- [ ] RLS enforces tenant isolation

### Task #5: User Management API
**Status:** Not Started  
**Dependencies:** Task #3  
**Acceptance Criteria:**
- [ ] POST /api/users (create user, assign role)
- [ ] GET /api/users (list users in tenant)
- [ ] GET /api/users/:id (single user)
- [ ] PUT /api/users/:id (update role, status)
- [ ] DELETE /api/users/:id (Owner only)

---

**Agent Status:** Ready  
**Current Focus:** Awaiting Supabase setup completion  
**Blockers:** Task #1 (DevOps)
