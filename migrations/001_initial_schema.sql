-- YBC ERP - Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Date: 2026-03-01
-- Description: Create all 25 tables with RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =======================
-- 1. TENANTS (Organizations)
-- =======================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- =======================
-- 2. USERS (Staff accounts)
-- =======================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('Owner', 'Accountant', 'Manager', 'Event Manager', 'Cashier', 'Analyst')),
  name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- =======================
-- 3. BRANCHES (Locations within tenant)
-- =======================
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_branches_tenant_id ON branches(tenant_id);

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- =======================
-- 4. MEMBERSHIP PLANS
-- =======================
CREATE TABLE membership_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('monthly', 'quarterly', 'annual', 'lifetime', 'custom')),
  duration_days INTEGER, -- NULL for lifetime
  daily_rate DECIMAL(10,2) NOT NULL, -- EUR per day
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_membership_plans_tenant_id ON membership_plans(tenant_id);

ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;

-- =======================
-- 5. MEMBERSHIPS
-- =======================
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  plan_id UUID NOT NULL REFERENCES membership_plans(id),
  client_name VARCHAR(255), -- if not linked to user
  start_date DATE NOT NULL,
  end_date DATE,
  payment_amount DECIMAL(10,2) NOT NULL,
  payment_currency VARCHAR(10) DEFAULT 'EUR',
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'cancelled', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_memberships_tenant_id ON memberships(tenant_id);
CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_status ON memberships(status);

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- =======================
-- 6. MEMBERSHIP FREEZE
-- =======================
CREATE TABLE membership_freeze (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_membership_freeze_tenant_id ON membership_freeze(tenant_id);
CREATE INDEX idx_membership_freeze_membership_id ON membership_freeze(membership_id);

ALTER TABLE membership_freeze ENABLE ROW LEVEL SECURITY;

-- =======================
-- 7. EVENTS
-- =======================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_tenant_id ON events(tenant_id);
CREATE INDEX idx_events_event_date ON events(event_date);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- =======================
-- 8. EVENT TICKETS (Ticket types)
-- =======================
CREATE TABLE event_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'EUR',
  quantity INTEGER NOT NULL,
  sold INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_tickets_tenant_id ON event_tickets(tenant_id);
CREATE INDEX idx_event_tickets_event_id ON event_tickets(event_id);

ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;

-- =======================
-- 9. TICKET SALES
-- =======================
CREATE TABLE ticket_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES event_tickets(id) ON DELETE CASCADE,
  client_name VARCHAR(255),
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_currency VARCHAR(10) DEFAULT 'EUR',
  sale_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ticket_sales_tenant_id ON ticket_sales(tenant_id);
CREATE INDEX idx_ticket_sales_event_id ON ticket_sales(event_id);

ALTER TABLE ticket_sales ENABLE ROW LEVEL SECURITY;

-- =======================
-- 10. CHART OF ACCOUNTS (IFRS)
-- =======================
CREATE TABLE chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  account_code VARCHAR(10) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense')),
  parent_account_id UUID REFERENCES chart_of_accounts(id),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, account_code)
);

CREATE INDEX idx_chart_accounts_tenant_id ON chart_of_accounts(tenant_id);
CREATE INDEX idx_chart_accounts_type ON chart_of_accounts(account_type);

ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;

-- =======================
-- 11. JOURNAL ENTRIES (Double-entry bookkeeping)
-- =======================
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
  transaction_date DATE NOT NULL,
  description TEXT,
  debit DECIMAL(15,2) DEFAULT 0,
  credit DECIMAL(15,2) DEFAULT 0,
  reference_type VARCHAR(50), -- 'bill', 'invoice', 'payment', etc.
  reference_id UUID,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_journal_entries_tenant_id ON journal_entries(tenant_id);
CREATE INDEX idx_journal_entries_account_id ON journal_entries(account_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(transaction_date);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- =======================
-- 12. BILLS (Payables, Accrual basis)
-- =======================
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vendor VARCHAR(255) NOT NULL,
  bill_date DATE NOT NULL, -- Service date (when expense is recognized)
  due_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'EUR',
  expense_account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
  status VARCHAR(50) DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partially_paid', 'paid')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bills_tenant_id ON bills(tenant_id);
CREATE INDEX idx_bills_bill_date ON bills(bill_date);
CREATE INDEX idx_bills_status ON bills(status);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- =======================
-- 13. BILL PAYMENTS (Cash outflow)
-- =======================
CREATE TABLE bill_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL, -- Cash flow date
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'EUR',
  wallet_id UUID, -- References wallets table (created later)
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bill_payments_tenant_id ON bill_payments(tenant_id);
CREATE INDEX idx_bill_payments_bill_id ON bill_payments(bill_id);

ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;

-- =======================
-- 14. INVOICES (Receivables)
-- =======================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_name VARCHAR(255) NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'EUR',
  revenue_account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
  status VARCHAR(50) DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partially_paid', 'paid')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_status ON invoices(status);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- =======================
-- 15. INVOICE PAYMENTS (Cash inflow)
-- =======================
CREATE TABLE invoice_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'EUR',
  wallet_id UUID,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoice_payments_tenant_id ON invoice_payments(tenant_id);
CREATE INDEX idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);

ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

-- =======================
-- 16. WALLETS (Multi-currency cash registers)
-- =======================
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  blockchain_network VARCHAR(50), -- 'Ethereum', 'BSC', 'Tron', 'Bitcoin', 'Arbitrum', 'Optimism', or NULL for fiat
  wallet_address VARCHAR(255),
  balance DECIMAL(18,8) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallets_tenant_id ON wallets(tenant_id);
CREATE INDEX idx_wallets_currency ON wallets(currency);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- =======================
-- 17. WALLET TRANSACTIONS
-- =======================
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer_in', 'transfer_out')),
  amount DECIMAL(18,8) NOT NULL,
  transaction_hash VARCHAR(255), -- blockchain TX hash
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallet_transactions_tenant_id ON wallet_transactions(tenant_id);
CREATE INDEX idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_date ON wallet_transactions(transaction_date);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- =======================
-- 18. BUDGET CATEGORIES
-- =======================
CREATE TABLE budget_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  expense_account_id UUID REFERENCES chart_of_accounts(id),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_budget_categories_tenant_id ON budget_categories(tenant_id);

ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

-- =======================
-- 19. BUDGETS (Monthly limits)
-- =======================
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES budget_categories(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- First day of month (e.g., 2026-03-01)
  limit_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'EUR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, category_id, month)
);

CREATE INDEX idx_budgets_tenant_id ON budgets(tenant_id);
CREATE INDEX idx_budgets_month ON budgets(month);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- =======================
-- 20. BUDGET ALERTS
-- =======================
CREATE TABLE budget_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  threshold_percent INTEGER NOT NULL, -- e.g., 80, 100, 120
  triggered_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'acknowledged')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_budget_alerts_tenant_id ON budget_alerts(tenant_id);
CREATE INDEX idx_budget_alerts_status ON budget_alerts(status);

ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY;

-- =======================
-- 21. AUDIT LOG
-- =======================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'login', etc.
  resource_type VARCHAR(100) NOT NULL, -- 'membership', 'bill', 'user', etc.
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_tenant_id ON audit_log(tenant_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- =======================
-- 22. NOTIFICATIONS
-- =======================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'budget_alert', 'membership_expiring', 'payment_received', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =======================
-- 23. INTEGRATIONS (External service configs)
-- =======================
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  service VARCHAR(100) NOT NULL, -- 'telegram', 'google_sheets', 'moralis', etc.
  config JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, service)
);

CREATE INDEX idx_integrations_tenant_id ON integrations(tenant_id);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- =======================
-- 24. SETTINGS (Tenant preferences)
-- =======================
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, key)
);

CREATE INDEX idx_settings_tenant_id ON settings(tenant_id);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- =======================
-- 25. ROLES (Future: custom role definitions)
-- =======================
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  permissions JSONB NOT NULL, -- {'memberships': ['read', 'write'], 'events': ['read'], ...}
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_roles_tenant_id ON roles(tenant_id);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- =======================
-- RLS POLICIES (Multi-tenancy isolation)
-- =======================

-- Generic policy for all tables: users can only access data in their tenant
-- Note: This requires setting app.current_tenant_id in session
-- Backend will handle this via: SET LOCAL app.current_tenant_id = '<tenant_id>';

-- Example policy for tenants table
CREATE POLICY tenant_isolation ON tenants
  FOR ALL
  USING (id = current_setting('app.current_tenant_id', true)::UUID);

-- Apply similar policy to all other tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename != 'tenants'
    AND tablename NOT LIKE 'pg_%'
  LOOP
    EXECUTE format('
      CREATE POLICY tenant_isolation ON %I
      FOR ALL
      USING (tenant_id = current_setting(''app.current_tenant_id'', true)::UUID)
    ', tbl);
  END LOOP;
END $$;

-- =======================
-- UPDATED_AT TRIGGER (Auto-update timestamps)
-- =======================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at column
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN 
    SELECT table_name 
    FROM information_schema.columns 
    WHERE column_name = 'updated_at' 
    AND table_schema = 'public'
  LOOP
    EXECUTE format('
      CREATE TRIGGER update_%I_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
    ', tbl, tbl);
  END LOOP;
END $$;

-- =======================
-- SEED DATA: Default Chart of Accounts (IFRS)
-- =======================

-- This will be inserted after first tenant is created
-- For now, we'll create a placeholder tenant for seeding

INSERT INTO tenants (id, name, status) 
VALUES ('00000000-0000-0000-0000-000000000000', 'System', 'active')
ON CONFLICT DO NOTHING;

-- Default chart of accounts (simplified IFRS)
INSERT INTO chart_of_accounts (tenant_id, account_code, account_name, account_type) VALUES
('00000000-0000-0000-0000-000000000000', '100', 'Assets', 'Asset'),
('00000000-0000-0000-0000-000000000000', '101', 'Cash - EUR', 'Asset'),
('00000000-0000-0000-0000-000000000000', '102', 'Cash - USD', 'Asset'),
('00000000-0000-0000-0000-000000000000', '103', 'Cash - USDT', 'Asset'),
('00000000-0000-0000-0000-000000000000', '110', 'Accounts Receivable', 'Asset'),
('00000000-0000-0000-0000-000000000000', '120', 'Crypto Wallets', 'Asset'),

('00000000-0000-0000-0000-000000000000', '200', 'Liabilities', 'Liability'),
('00000000-0000-0000-0000-000000000000', '210', 'Accounts Payable', 'Liability'),
('00000000-0000-0000-0000-000000000000', '220', 'Deferred Revenue', 'Liability'),

('00000000-0000-0000-0000-000000000000', '300', 'Equity', 'Equity'),
('00000000-0000-0000-0000-000000000000', '310', 'Retained Earnings', 'Equity'),

('00000000-0000-0000-0000-000000000000', '400', 'Revenue', 'Revenue'),
('00000000-0000-0000-0000-000000000000', '410', 'Membership Revenue', 'Revenue'),
('00000000-0000-0000-0000-000000000000', '420', 'Event Revenue', 'Revenue'),

('00000000-0000-0000-0000-000000000000', '500', 'Expenses', 'Expense'),
('00000000-0000-0000-0000-000000000000', '501', 'Rent', 'Expense'),
('00000000-0000-0000-0000-000000000000', '502', 'Utilities', 'Expense'),
('00000000-0000-0000-0000-000000000000', '503', 'Salaries', 'Expense'),
('00000000-0000-0000-0000-000000000000', '504', 'Marketing', 'Expense'),
('00000000-0000-0000-0000-000000000000', '510', 'Royalty to Parent YBC', 'Expense')
ON CONFLICT DO NOTHING;

-- Migration complete
