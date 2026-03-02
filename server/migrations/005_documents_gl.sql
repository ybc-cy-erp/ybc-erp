-- =====================================================
-- Migration 005: Document Journal & GL (General Ledger)
-- =====================================================

-- Document Journal (все документы в одном месте)
CREATE TABLE IF NOT EXISTS document_journal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL, -- 'PKO', 'RKO', 'invoice', 'contract', 'act', etc.
  doc_number TEXT NOT NULL,
  doc_date DATE NOT NULL,
  counterparty_id UUID REFERENCES counterparties(id),
  amount NUMERIC(12,2),
  currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
  notes TEXT,
  file_url TEXT,
  tags TEXT[],
  folder_id UUID, -- для организации в папки (пока не создаем таблицу папок)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Journal Entries (проводки GL)
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id UUID REFERENCES document_journal(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  description TEXT,
  debit_account UUID REFERENCES chart_of_accounts(id),
  credit_account UUID REFERENCES chart_of_accounts(id),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'EUR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  CONSTRAINT balanced_entry CHECK (debit_account IS NOT NULL AND credit_account IS NOT NULL)
);

-- Cash Documents (ПКО/РКО)
CREATE TABLE IF NOT EXISTS cash_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('PKO', 'RKO')),
  doc_number TEXT NOT NULL,
  doc_date DATE NOT NULL,
  wallet_id UUID REFERENCES wallets(id),
  counterparty_id UUID REFERENCES counterparties(id),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'EUR',
  purpose TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
  document_id UUID REFERENCES document_journal(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_document_journal_tenant ON document_journal(tenant_id);
CREATE INDEX idx_document_journal_date ON document_journal(tenant_id, doc_date);
CREATE INDEX idx_document_journal_type ON document_journal(tenant_id, doc_type);
CREATE INDEX idx_document_journal_counterparty ON document_journal(counterparty_id);

CREATE INDEX idx_journal_entries_tenant ON journal_entries(tenant_id);
CREATE INDEX idx_journal_entries_document ON journal_entries(document_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(tenant_id, entry_date);
CREATE INDEX idx_journal_entries_debit ON journal_entries(debit_account);
CREATE INDEX idx_journal_entries_credit ON journal_entries(credit_account);

CREATE INDEX idx_cash_documents_tenant ON cash_documents(tenant_id);
CREATE INDEX idx_cash_documents_date ON cash_documents(tenant_id, doc_date);
CREATE INDEX idx_cash_documents_type ON cash_documents(doc_type);

-- RLS Policies
ALTER TABLE document_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_documents ENABLE ROW LEVEL SECURITY;

-- document_journal policies
CREATE POLICY "document_journal_tenant_select"
ON document_journal FOR SELECT
USING (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);

CREATE POLICY "document_journal_tenant_insert"
ON document_journal FOR INSERT
WITH CHECK (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);

CREATE POLICY "document_journal_tenant_update"
ON document_journal FOR UPDATE
USING (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);

CREATE POLICY "document_journal_tenant_delete"
ON document_journal FOR DELETE
USING (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);

-- journal_entries policies
CREATE POLICY "journal_entries_tenant_select"
ON journal_entries FOR SELECT
USING (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);

CREATE POLICY "journal_entries_tenant_insert"
ON journal_entries FOR INSERT
WITH CHECK (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);

CREATE POLICY "journal_entries_tenant_update"
ON journal_entries FOR UPDATE
USING (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);

CREATE POLICY "journal_entries_tenant_delete"
ON journal_entries FOR DELETE
USING (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);

-- cash_documents policies
CREATE POLICY "cash_documents_tenant_select"
ON cash_documents FOR SELECT
USING (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);

CREATE POLICY "cash_documents_tenant_insert"
ON cash_documents FOR INSERT
WITH CHECK (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);

CREATE POLICY "cash_documents_tenant_update"
ON cash_documents FOR UPDATE
USING (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);

CREATE POLICY "cash_documents_tenant_delete"
ON cash_documents FOR DELETE
USING (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);

-- Функция автонумерации документов
CREATE OR REPLACE FUNCTION generate_doc_number(
  p_tenant_id UUID,
  p_doc_type TEXT,
  p_doc_date DATE
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_prefix TEXT;
  v_seq INT;
  v_year TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM p_doc_date)::TEXT;
  v_prefix := p_doc_type || '-' || v_year || '-';
  
  SELECT COALESCE(MAX(SUBSTRING(doc_number FROM '\d+$')::INT), 0) + 1
  INTO v_seq
  FROM document_journal
  WHERE tenant_id = p_tenant_id
    AND doc_type = p_doc_type
    AND EXTRACT(YEAR FROM doc_date) = EXTRACT(YEAR FROM p_doc_date);
  
  RETURN v_prefix || LPAD(v_seq::TEXT, 4, '0');
END;
$$;
