-- Enable RLS on users table if not enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

-- SELECT: Users can view other users in their tenant
CREATE POLICY "users_select_policy" ON users
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- INSERT: Only Owners and Admins can invite new users
CREATE POLICY "users_insert_policy" ON users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND tenant_id = users.tenant_id
        AND role IN ('Owner', 'Admin')
    )
  );

-- UPDATE: Owners and Admins can update any user, users can update themselves
CREATE POLICY "users_update_policy" ON users
  FOR UPDATE
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.tenant_id = users.tenant_id
        AND u.role IN ('Owner', 'Admin')
    )
  );

-- DELETE: Only Owners can delete users
CREATE POLICY "users_delete_policy" ON users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND tenant_id = users.tenant_id
        AND role = 'Owner'
    )
  );
