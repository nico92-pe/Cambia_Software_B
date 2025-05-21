/*
  # Update roles and policies

  1. Changes
    - Update role check constraint to new roles
    - Convert LOGISTICA users to ADMIN
    - Update RLS policies for new role structure
    - Ensure proper access control based on roles

  2. Security
    - Super admin has full access
    - Users can read/update their own profiles
    - Role changes are restricted
*/

-- Update role check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'asesor_ventas'::text]));

-- Update existing LOGISTICA users to ADMIN
UPDATE profiles SET role = 'admin' WHERE role = 'logistica';

-- Update RLS policies
DROP POLICY IF EXISTS "Enable read access for administrators" ON profiles;
DROP POLICY IF EXISTS "Enable update access for administrators" ON profiles;

-- Super admin can do everything
CREATE POLICY "Super admin can do everything" ON profiles
  FOR ALL
  TO authenticated
  USING (role = 'super_admin')
  WITH CHECK (role = 'super_admin');

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile except role
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    COALESCE(NEW.role = OLD.role, true)
  );