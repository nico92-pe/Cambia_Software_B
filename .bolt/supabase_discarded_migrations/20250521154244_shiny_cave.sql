/*
  # Update roles and permissions

  1. Changes
    - Remove LOGISTICA role
    - Add SUPER_ADMIN and ADMIN roles
    - Update RLS policies for profiles table
    - Update role check constraint

  2. Security
    - Enable RLS on profiles table
    - Add policies for different roles
    - Super admin can manage all users
    - Users can read/update their own profiles
*/

-- Update role check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role = ANY (ARRAY['SUPER_ADMIN'::text, 'ADMIN'::text, 'ASESOR_VENTAS'::text]));

-- Update existing LOGISTICA users to ADMIN
UPDATE profiles SET role = 'ADMIN' WHERE role = 'LOGISTICA';

-- Update RLS policies
DROP POLICY IF EXISTS "Enable read access for administrators" ON profiles;
DROP POLICY IF EXISTS "Enable update access for administrators" ON profiles;

-- Super admin can do everything
CREATE POLICY "Super admin can do everything" ON profiles
  FOR ALL
  TO authenticated
  USING (role = 'SUPER_ADMIN'::text)
  WITH CHECK (role = 'SUPER_ADMIN'::text);

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