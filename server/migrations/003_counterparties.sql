-- =====================================================
-- Migration 003: Counterparties (Контрагенты)
-- =====================================================

-- Folders for counterparties
CREATE TABLE IF NOT EXISTS counterparty_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES counterparty_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Counterparties
CREATE TABLE IF NOT EXISTS counterparties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES counterparty_folders(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  full_name TEXT,
  tax_id TEXT,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  tags TEXT[],
  custom_fields JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_counterparties_tenant ON counterparties(tenant_id);
CREATE INDEX idx_counterparties_folder ON counterparties(folder_id);
CREATE INDEX idx_counterparties_name ON counterparties(tenant_id, name);
CREATE INDEX idx_counterparty_folders_tenant ON counterparty_folders(tenant_id);

-- RLS Policies
ALTER TABLE counterparty_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE counterparties ENABLE ROW LEVEL SECURITY;

-- counterparty_folders policies
CREATE POLICY "folders_tenant_select"
ON counterparty_folders FOR SELECT
USING (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);

CREATE POLICY "folders_tenant_insert"
ON counterparty_folders FOR INSERT
WITH CHECK (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);

CREATE POLICY "folders_tenant_update"
ON counterparty_folders FOR UPDATE
USING (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);

CREATE POLICY "folders_tenant_delete"
ON counterparty_folders FOR DELETE
USING (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);

-- counterparties policies
CREATE POLICY "counterparties_tenant_select"
ON counterparties FOR SELECT
USING (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);

CREATE POLICY "counterparties_tenant_insert"
ON counterparties FOR INSERT
WITH CHECK (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);

CREATE POLICY "counterparties_tenant_update"
ON counterparties FOR UPDATE
USING (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);

CREATE POLICY "counterparties_tenant_delete"
ON counterparties FOR DELETE
USING (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);
