-- Fix recursive RLS policies on users table (caused 500: infinite recursion detected)
-- Uses auth JWT metadata claims instead of querying users inside users policies.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

-- SELECT: users can read users from their own tenant
CREATE POLICY "users_select_policy" ON users
  FOR SELECT
  USING (
    tenant_id::text = COALESCE(auth.jwt() -> 'user_metadata' ->> 'tenant_id', '')
  );

-- INSERT: only Owner/Admin can invite users within same tenant
CREATE POLICY "users_insert_policy" ON users
  FOR INSERT
  WITH CHECK (
    tenant_id::text = COALESCE(auth.jwt() -> 'user_metadata' ->> 'tenant_id', '')
    AND COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('Owner', 'Admin')
  );

-- UPDATE: users can update themselves; Owner/Admin can update any user in same tenant
CREATE POLICY "users_update_policy" ON users
  FOR UPDATE
  USING (
    id = auth.uid()
    OR (
      tenant_id::text = COALESCE(auth.jwt() -> 'user_metadata' ->> 'tenant_id', '')
      AND COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('Owner', 'Admin')
    )
  )
  WITH CHECK (
    tenant_id::text = COALESCE(auth.jwt() -> 'user_metadata' ->> 'tenant_id', '')
  );

-- DELETE: only Owner can delete users in same tenant
CREATE POLICY "users_delete_policy" ON users
  FOR DELETE
  USING (
    tenant_id::text = COALESCE(auth.jwt() -> 'user_metadata' ->> 'tenant_id', '')
    AND COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'Owner'
  );
