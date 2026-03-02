-- =====================================================
-- Migration 004: Items (Товари та послуги)
-- =====================================================

-- Folders for items
CREATE TABLE IF NOT EXISTS item_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES item_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items (products, services, memberships)
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES item_folders(id) ON DELETE SET NULL,
  code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT DEFAULT 'шт',
  price_default NUMERIC(12,2),
  currency TEXT DEFAULT 'EUR',
  item_type TEXT CHECK (item_type IN ('product', 'service', 'membership')),
  gl_account_income UUID REFERENCES chart_of_accounts(id),
  gl_account_expense UUID REFERENCES chart_of_accounts(id),
  tags TEXT[],
  custom_fields JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_items_tenant ON items(tenant_id);
CREATE INDEX idx_items_folder ON items(folder_id);
CREATE INDEX idx_items_code ON items(tenant_id, code);
CREATE INDEX idx_items_name ON items(tenant_id, name);
CREATE INDEX idx_item_folders_tenant ON item_folders(tenant_id);

-- RLS Policies
ALTER TABLE item_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- item_folders policies
CREATE POLICY "item_folders_tenant_select"
ON item_folders FOR SELECT
USING (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);

CREATE POLICY "item_folders_tenant_insert"
ON item_folders FOR INSERT
WITH CHECK (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);

CREATE POLICY "item_folders_tenant_update"
ON item_folders FOR UPDATE
USING (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);

CREATE POLICY "item_folders_tenant_delete"
ON item_folders FOR DELETE
USING (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);

-- items policies
CREATE POLICY "items_tenant_select"
ON items FOR SELECT
USING (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);

CREATE POLICY "items_tenant_insert"
ON items FOR INSERT
WITH CHECK (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);

CREATE POLICY "items_tenant_update"
ON items FOR UPDATE
USING (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);

CREATE POLICY "items_tenant_delete"
ON items FOR DELETE
USING (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);
