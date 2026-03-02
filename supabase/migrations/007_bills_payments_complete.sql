-- Migration 007: Complete Bills and Payments
-- Author: AI Assistant
-- Date: 2026-03-02
-- Description: Link bills to counterparties, add payment tracking, currency exchange, transfers

-- 1. Add counterparty_id to bills
ALTER TABLE bills 
  ADD COLUMN counterparty_id UUID REFERENCES counterparties(id) ON DELETE SET NULL;

CREATE INDEX idx_bills_counterparty ON bills(counterparty_id);

-- 2. Keep vendor_name for backward compatibility
COMMENT ON COLUMN bills.counterparty_id IS 'Link to counterparty (supplier/vendor). If null, use vendor_name';

-- 3. Add currency exchange transactions table
CREATE TABLE currency_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  from_amount NUMERIC(15, 2) NOT NULL,
  to_amount NUMERIC(15, 2) NOT NULL,
  exchange_rate NUMERIC(15, 6) NOT NULL,
  exchange_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_currency_exchanges_tenant ON currency_exchanges(tenant_id);
CREATE INDEX idx_currency_exchanges_date ON currency_exchanges(exchange_date);

-- 4. Add cash transfers table (between wallets or internal)
CREATE TABLE cash_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  from_account VARCHAR(100) NOT NULL,
  to_account VARCHAR(100) NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  transfer_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  reference VARCHAR(100),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cash_transfers_tenant ON cash_transfers(tenant_id);
CREATE INDEX idx_cash_transfers_date ON cash_transfers(transfer_date);

-- 5. RLS policies for currency_exchanges
ALTER TABLE currency_exchanges ENABLE ROW LEVEL SECURITY;

CREATE POLICY currency_exchanges_tenant_isolation ON currency_exchanges
  USING (tenant_id = COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid,
    (current_setting('request.jwt.claims', true)::json->'user_metadata'->>'tenant_id')::uuid
  ));

-- 6. RLS policies for cash_transfers
ALTER TABLE cash_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY cash_transfers_tenant_isolation ON cash_transfers
  USING (tenant_id = COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid,
    (current_setting('request.jwt.claims', true)::json->'user_metadata'->>'tenant_id')::uuid
  ));

COMMENT ON TABLE currency_exchanges IS 'Currency exchange transactions between different currencies';
COMMENT ON TABLE cash_transfers IS 'Internal cash transfers between accounts/wallets';
