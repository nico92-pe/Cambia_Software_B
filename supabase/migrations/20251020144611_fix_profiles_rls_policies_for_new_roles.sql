/*
  # Fix RLS Policies for New Role Values

  1. Changes
    - Update "Enable read access for administrators" policy to use 'super_admin' and 'admin' instead of 'ADMINISTRADOR'
    - Update "Enable update access for administrators" policy to use 'super_admin' and 'admin' instead of 'ADMINISTRADOR'
    - These policies were preventing admin users from viewing and managing profiles because they were checking for the old 'ADMINISTRADOR' role value

  2. Security
    - Maintains the same security model: super_admin and admin users can view and update all profiles
    - Regular users can only view and update their own profile
    - Anyone can view profiles with 'asesor_ventas' role (needed for order management)

  3. Impact
    - This fix will allow users with 'admin' and 'super_admin' roles to properly access user management features
    - Specifically fixes the "No hay vendedores disponibles" issue in the client form
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for administrators" ON profiles;
DROP POLICY IF EXISTS "Enable update access for administrators" ON profiles;

-- Recreate read policy with correct role values
CREATE POLICY "Enable read access for administrators"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (role IN ('super_admin', 'admin')) OR (id = auth.uid())
  );

-- Recreate update policy with correct role values
CREATE POLICY "Enable update access for administrators"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    (role IN ('super_admin', 'admin')) OR (id = auth.uid())
  )
  WITH CHECK (
    (role IN ('super_admin', 'admin')) OR (id = auth.uid())
  );
