/*
  # Fix RLS Policies to Check Current User Role

  1. Problem
    - The current policies check if the PROFILE BEING VIEWED has admin/super_admin role
    - This is incorrect - we need to check if the CURRENT USER has admin/super_admin role
    - This was preventing admin users from viewing other users' profiles

  2. Solution
    - Update policies to check the current user's role using a subquery to profiles table
    - Allow users with 'super_admin' or 'admin' roles to view and update all profiles
    - Allow users to view and update their own profile
    - Keep the existing policy that allows anyone to view salespersons

  3. Security
    - Only super_admin and admin users can view all profiles
    - Regular users can only view their own profile
    - Anyone can view profiles with 'asesor_ventas' role (needed for order management)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for administrators" ON profiles;
DROP POLICY IF EXISTS "Enable update access for administrators" ON profiles;

-- Create read policy that checks CURRENT USER's role
CREATE POLICY "Enable read access for administrators"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if current user is admin or super_admin
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('super_admin', 'admin')
    )
    OR
    -- Allow users to read their own profile
    id = auth.uid()
  );

-- Create update policy that checks CURRENT USER's role
CREATE POLICY "Enable update access for administrators"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow if current user is admin or super_admin
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('super_admin', 'admin')
    )
    OR
    -- Allow users to update their own profile
    id = auth.uid()
  )
  WITH CHECK (
    -- Allow if current user is admin or super_admin
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('super_admin', 'admin')
    )
    OR
    -- Allow users to update their own profile
    id = auth.uid()
  );
