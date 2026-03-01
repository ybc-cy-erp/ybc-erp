# YBC ERP - Week 3 Sprint Tasks

**Sprint:** Week 3 - Events, Tickets & Bills  
**Dates:** 2026-03-01 (продовження)  
**Goal:** Event management, ticket sales, bills & payments with accrual accounting

---

## Backend Tasks

### Task #28: Events CRUD API
**Assigned to:** Backend Developer  
**Priority:** 🔴 Critical  
**Dependencies:** Database schema (events table)

**Endpoints:**
- `POST /api/events` - Create event
- `GET /api/events` - List events (filters: status, date range)
- `GET /api/events/:id` - Get single event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Soft delete (cancel event)

**Fields:**
- name (required)
- description
- event_date (required)
- location
- capacity (required, integer)
- status (draft, published, cancelled)
- created_by (user_id)

**Business Rules:**
- Only Owner/Manager can create events
- Published events cannot be deleted (only cancelled)
- Capacity must be > 0

---

### Task #29: Ticket Types API
**Assigned to:** Backend Developer  
**Priority:** 🔴 Critical  
**Dependencies:** Task #28

**Endpoints:**
- `POST /api/events/:eventId/ticket-types` - Create ticket type
- `GET /api/events/:eventId/ticket-types` - List ticket types for event
- `PUT /api/ticket-types/:id` - Update ticket type
- `DELETE /api/ticket-types/:id` - Delete ticket type

**Fields:**
- event_id (FK)
- name (e.g., "VIP", "Standard", "Early Bird")
- price (EUR, required)
- quantity_available (required)
- quantity_sold (auto-calculated)

**Business Rules:**
- Cannot delete ticket type if tickets sold
- quantity_sold cannot exceed quantity_available

---

### Task #30: Ticket Sales API
**Assigned to:** Backend Developer  
**Priority:** 🔴 Critical  
**Dependencies:** Task #29

**Endpoints:**
- `POST /api/tickets` - Sell ticket(s)
- `GET /api/tickets` - List ticket sales
- `GET /api/tickets/:id` - Get ticket details
- `POST /api/tickets/:id/refund` - Refund ticket (reversal accounting)

**Fields:**
- ticket_type_id (FK)
- customer_name (required)
- quantity (default: 1)
- total_amount (price × quantity)
- sale_date (auto: now)
- status (sold, refunded)

**Business Rules:**
- Check capacity before sale
- Deferred revenue for future events (event_date > today)
- Recognize revenue on event_date
- Refund = reversal (debit Revenue, credit Deferred Revenue)

---

### Task #31: Bills CRUD API (Accrual Accounting)
**Assigned to:** Backend Developer  
**Priority:** 🔴 Critical  
**Dependencies:** Database schema (bills table)

**Endpoints:**
- `POST /api/bills` - Create bill
- `GET /api/bills` - List bills (filters: status, date range, vendor)
- `GET /api/bills/:id` - Get bill details
- `PUT /api/bills/:id` - Update bill
- `PUT /api/bills/:id/approve` - Approve bill (draft → approved)
- `DELETE /api/bills/:id` - Soft delete

**Fields:**
- bill_number (auto-generated, unique)
- vendor_name (required)
- bill_date (service date, required) ← **Accrual accounting**
- due_date (required)
- amount (EUR, required)
- status (draft, approved, paid)
- description
- category (expense account)

**Business Rules:**
- Expense recognized on bill_date (not payment_date)
- Status workflow: draft → approved → paid
- Cannot approve bill with amount <= 0

---

### Task #32: Payments API
**Assigned to:** Backend Developer  
**Priority:** 🟡 High  
**Dependencies:** Task #31

**Endpoints:**
- `POST /api/payments` - Record payment
- `GET /api/payments` - List payments
- `GET /api/payments/:id` - Get payment details
- `POST /api/bills/:billId/pay` - Match payment to bill

**Fields:**
- bill_id (FK, nullable for unmatched payments)
- payment_date (required)
- amount (EUR, required)
- payment_method (cash, bank_transfer, crypto)
- wallet_id (FK, which wallet paid from)

**Business Rules:**
- Payment_date affects cash flow (not expense recognition)
- Bill can have multiple partial payments
- Sum of payments cannot exceed bill amount

---

## Frontend Tasks

### Task #33: Events List & CRUD UI
**Assigned to:** Frontend Developer  
**Priority:** 🟡 High  
**Dependencies:** Task #28

**Pages:**
- `/events` - Events list with filters (status, date range)
- `/events/create` - Create event form
- `/events/:id/edit` - Edit event form
- `/events/:id` - Event details page

**Features:**
- Events grid/table view
- Status badges (draft, published, cancelled)
- Date range picker
- Capacity indicator (sold/total)
- Cancel event button (with confirmation)

---

### Task #34: Ticket Types & Sales UI
**Assigned to:** Frontend Developer  
**Priority:** 🟡 High  
**Dependencies:** Task #33

**Pages:**
- `/events/:id/tickets` - Ticket types list for event
- `/tickets/sell` - Sell ticket form (select event → ticket type → quantity)
- `/tickets` - All ticket sales list

**Features:**
- Add/edit ticket types (inline modal)
- Real-time capacity check
- Sold out indicator
- Revenue breakdown (deferred vs recognized)

---

### Task #35: Bills List & CRUD UI
**Assigned to:** Frontend Developer  
**Priority:** 🟡 High  
**Dependencies:** Task #31

**Pages:**
- `/bills` - Bills list with filters (status, vendor, date range)
- `/bills/create` - Create bill form
- `/bills/:id/edit` - Edit bill (draft only)
- `/bills/:id` - Bill details + payment history

**Features:**
- Bill status workflow UI (draft → approved → paid)
- Approve button (Owner/Manager only)
- Payment matching interface
- Aging report (overdue bills in red)

---

### Task #36: Payments UI
**Assigned to:** Frontend Developer  
**Priority:** 🟡 High  
**Dependencies:** Task #35

**Pages:**
- `/payments` - Payments list
- `/payments/create` - Record payment (match to bill)

**Features:**
- Payment method selector (cash, bank, crypto)
- Wallet selector (multi-currency)
- Bill lookup (autocomplete by vendor/number)
- Partial payment support

---

## QA Tasks

### Task #37: QA - Events & Tickets Module
**Assigned to:** QA Engineer  
**Priority:** 🟡 High  
**Dependencies:** Tasks #33-34

**Test Cases:**
1. Create event with ticket types
2. Sell tickets (check capacity control)
3. Attempt to oversell (should fail)
4. Cancel event (verify status change)
5. Refund ticket (verify reversal accounting)
6. Deferred revenue calculation

**Pass Criteria:** All tests pass, QA PASS issued

---

### Task #38: QA - Bills & Payments Module
**Assigned to:** QA Engineer  
**Priority:** 🟡 High  
**Dependencies:** Tasks #35-36

**Test Cases:**
1. Create bill (draft status)
2. Approve bill (status → approved)
3. Record payment (full amount)
4. Record partial payments
5. Verify accrual accounting (expense on bill_date)
6. Verify cash flow (payment_date)
7. Aging report accuracy

**Pass Criteria:** All tests pass, QA PASS issued

---

### Task #39: Integration Testing - Week 3
**Assigned to:** QA Engineer  
**Priority:** 🟡 High  
**Dependencies:** Tasks #37-38

**Test Scenarios:**
1. End-to-end: Create event → Sell tickets → Event occurs → Revenue recognized
2. Bills workflow: Create → Approve → Pay → Account balances updated
3. Multi-currency payments (from different wallets)
4. Security: Role-based access control
5. Performance: Large dataset (100 events, 1000 tickets)

**Pass Criteria:** All integration tests pass, QA PASS issued

---

## Database Schema (if not exists)

### events table
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  event_date TIMESTAMP NOT NULL,
  location VARCHAR(200),
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### ticket_types table
```sql
CREATE TABLE ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id),
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  quantity_available INTEGER NOT NULL CHECK (quantity_available > 0),
  quantity_sold INTEGER DEFAULT 0 CHECK (quantity_sold >= 0 AND quantity_sold <= quantity_available),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### tickets table
```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  ticket_type_id UUID NOT NULL REFERENCES ticket_types(id),
  customer_name VARCHAR(200) NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  total_amount DECIMAL(10,2) NOT NULL,
  sale_date TIMESTAMP DEFAULT now(),
  status VARCHAR(20) DEFAULT 'sold' CHECK (status IN ('sold', 'refunded')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### bills table
```sql
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  bill_number VARCHAR(50) UNIQUE NOT NULL,
  vendor_name VARCHAR(200) NOT NULL,
  bill_date DATE NOT NULL, -- Service date (accrual)
  due_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid')),
  description TEXT,
  category VARCHAR(100), -- Expense account
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### payments table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  bill_id UUID REFERENCES bills(id),
  payment_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'crypto')),
  wallet_id UUID REFERENCES wallets(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

---

## Success Criteria

✅ **Week 3 Complete When:**
1. All 12 tasks (#28-39) completed
2. QA PASS issued for all modules
3. Integration tests pass
4. Code pushed to GitHub
5. Deployed to Railway
6. Documentation updated

---

**Total Tasks:** 12  
**Estimated Time:** 4-6 hours (with automation)  
**Start Time:** 2026-03-01 14:00 GMT+1
