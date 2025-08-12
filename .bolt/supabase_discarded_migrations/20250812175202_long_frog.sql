/*
  # Update profiles RLS policy for orders

  1. Policy Changes
    - Update the SELECT policy on profiles to allow super_admin and admin to read all profiles
    - This ensures that order queries can properly fetch salesperson and client data

  2. Security
    - Maintains existing security for regular users (can only read their own profile)
    - Allows administrators to read all profiles for order management
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Enable read access for administrators" ON profiles;

-- Create updated policy that allows super_admin and admin to read all profiles
CREATE POLICY "Enable read access for administrators and own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('super_admin', 'admin')
    )) 
    OR 
    (id = auth.uid())
  );