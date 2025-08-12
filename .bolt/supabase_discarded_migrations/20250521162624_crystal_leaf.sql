/*
  # Update roles and policies

  1. Changes
    - Update role values to lowercase
    - Convert existing roles
    - Update RLS policies
    - Update admin principal to super_admin
  
  2. Security
    - Enable RLS
    - Add policies for super_admin and users
*/

-- Update role check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'asesor_ventas'::text]));

-- Update existing roles to lowercase
UPDATE profiles SET role = LOWER(role);
UPDATE profiles SET role = 'admin' WHERE role = 'logistica';

-- Update the admin principal to super admin
UPDATE profiles 
SET role = 'super_admin' 
WHERE email = 'admin@cambia.com';

-- Update RLS policies
DROP POLICY IF EXISTS "Enable read access for administrators" ON profiles;
DROP POLICY IF EXISTS "Enable update access for administrators" ON profiles;
DROP POLICY IF EXISTS "Super admin can do everything" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

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