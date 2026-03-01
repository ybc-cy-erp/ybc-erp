-- Migration 002: Events, Tickets & Bills Module
-- Created: 2026-03-01
-- Purpose: Add tables for event management, ticket sales, and bills/payments

-- ============================================================
-- EVENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  event_date TIMESTAMP NOT NULL,
  location VARCHAR(200),
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_events_tenant ON events(tenant_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_date ON events(event_date);

-- RLS for events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY events_tenant_isolation ON events
  FOR ALL
  USING (tenant_id::text = current_setting('request.jwt.claims', true)::json->>'tenant_id');

-- Auto-update trigger for events
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TICKET TYPES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  quantity_available INTEGER NOT NULL CHECK (quantity_available > 0),
  quantity_sold INTEGER DEFAULT 0 CHECK (quantity_sold >= 0 AND quantity_sold <= quantity_available),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_ticket_types_event ON ticket_types(event_id);

-- RLS for ticket_types (inherit from events)
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY ticket_types_tenant_isolation ON ticket_types
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = ticket_types.event_id
      AND events.tenant_id::text = current_setting('request.jwt.claims', true)::json->>'tenant_id'
    )
  );

-- Auto-update trigger for ticket_types
CREATE TRIGGER update_ticket_types_updated_at
  BEFORE UPDATE ON ticket_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TICKETS TABLE (Sales)
-- ============================================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ticket_type_id UUID NOT NULL REFERENCES ticket_types(id) ON DELETE RESTRICT,
  customer_name VARCHAR(200) NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  total_amount DECIMAL(10,2) NOT NULL,
  sale_date TIMESTAMP DEFAULT now(),
  status VARCHAR(20) DEFAULT 'sold' CHECK (status IN ('sold', 'refunded')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_tickets_tenant ON tickets(tenant_id);
CREATE INDEX idx_tickets_ticket_type ON tickets(ticket_type_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_sale_date ON tickets(sale_date);

-- RLS for tickets
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY tickets_tenant_isolation ON tickets
  FOR ALL
  USING (tenant_id::text = current_setting('request.jwt.claims', true)::json->>'tenant_id');

-- Auto-update trigger for tickets
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- BILLS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  bill_number VARCHAR(50) NOT NULL,
  vendor_name VARCHAR(200) NOT NULL,
  bill_date DATE NOT NULL, -- Service date (accrual accounting)
  due_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid')),
  description TEXT,
  category VARCHAR(100), -- Expense account
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(tenant_id, bill_number)
);

CREATE INDEX idx_bills_tenant ON bills(tenant_id);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_bill_date ON bills(bill_date);
CREATE INDEX idx_bills_due_date ON bills(due_date);
CREATE INDEX idx_bills_vendor ON bills(vendor_name);

-- RLS for bills
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY bills_tenant_isolation ON bills
  FOR ALL
  USING (tenant_id::text = current_setting('request.jwt.claims', true)::json->>'tenant_id');

-- Auto-update trigger for bills
CREATE TRIGGER update_bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PAYMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  bill_id UUID REFERENCES bills(id) ON DELETE SET NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'crypto')),
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_bill ON payments(bill_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_wallet ON payments(wallet_id);

-- RLS for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY payments_tenant_isolation ON payments
  FOR ALL
  USING (tenant_id::text = current_setting('request.jwt.claims', true)::json->>'tenant_id');

-- Auto-update trigger for payments
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function: Auto-increment ticket_types.quantity_sold on ticket purchase
CREATE OR REPLACE FUNCTION increment_ticket_sold()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'sold' THEN
    UPDATE ticket_types
    SET quantity_sold = quantity_sold + NEW.quantity
    WHERE id = NEW.ticket_type_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_sold_increment
  AFTER INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION increment_ticket_sold();

-- Function: Decrement quantity_sold on refund
CREATE OR REPLACE FUNCTION decrement_ticket_sold()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'refunded' AND OLD.status = 'sold' THEN
    UPDATE ticket_types
    SET quantity_sold = quantity_sold - NEW.quantity
    WHERE id = NEW.ticket_type_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_refund_decrement
  AFTER UPDATE ON tickets
  FOR EACH ROW
  WHEN (NEW.status = 'refunded' AND OLD.status = 'sold')
  EXECUTE FUNCTION decrement_ticket_sold();

-- Function: Auto-update bill status to 'paid' when payments sum >= bill amount
CREATE OR REPLACE FUNCTION check_bill_paid_status()
RETURNS TRIGGER AS $$
DECLARE
  total_paid DECIMAL(10,2);
  bill_amount DECIMAL(10,2);
BEGIN
  -- Get total payments for this bill
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM payments
  WHERE bill_id = NEW.bill_id AND bill_id IS NOT NULL;

  -- Get bill amount
  SELECT amount INTO bill_amount
  FROM bills
  WHERE id = NEW.bill_id;

  -- Update bill status if fully paid
  IF total_paid >= bill_amount THEN
    UPDATE bills
    SET status = 'paid'
    WHERE id = NEW.bill_id AND status != 'paid';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_check_bill_paid
  AFTER INSERT ON payments
  FOR EACH ROW
  WHEN (NEW.bill_id IS NOT NULL)
  EXECUTE FUNCTION check_bill_paid_status();

-- ============================================================
-- SEED DATA (Optional - for testing)
-- ============================================================

-- Note: Seed data will be added by application if needed

COMMENT ON TABLE events IS 'Event management (conferences, workshops, parties)';
COMMENT ON TABLE ticket_types IS 'Ticket types per event (VIP, Standard, etc.)';
COMMENT ON TABLE tickets IS 'Ticket sales records';
COMMENT ON TABLE bills IS 'Bills from vendors (accrual accounting: expense on bill_date)';
COMMENT ON TABLE payments IS 'Payment records (cash flow on payment_date)';
