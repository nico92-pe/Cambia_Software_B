/*
  # Fix RLS Infinite Recursion Error

  1. Problem
    - The current RLS policies query the profiles table within the policy itself
    - This creates infinite recursion when checking permissions
    - Users cannot authenticate or access their profiles

  2. Solution
    - Create a security definer function in public schema that bypasses RLS to check user role
    - Update policies to use this function instead of subqueries
    - This breaks the recursion cycle

  3. Security
    - The function only returns the current user's role, not other user data
    - RLS is still enforced, just without the recursion issue
    - Users can read their own profile
    - Admins and super_admins can read all profiles
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Enable read access for administrators" ON profiles;
DROP POLICY IF EXISTS "Enable update access for administrators" ON profiles;

-- Drop function if exists
DROP FUNCTION IF EXISTS public.get_current_user_role();

-- Create a helper function to get current user's role without RLS
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Create read policy using the helper function
CREATE POLICY "Enable read access for administrators"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if current user is admin or super_admin
    public.get_current_user_role() IN ('super_admin', 'admin')
    OR
    -- Allow users to read their own profile
    id = auth.uid()
  );

-- Create update policy using the helper function
CREATE POLICY "Enable update access for administrators"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow if current user is admin or super_admin
    public.get_current_user_role() IN ('super_admin', 'admin')
    OR
    -- Allow users to update their own profile
    id = auth.uid()
  )
  WITH CHECK (
    -- Allow if current user is admin or super_admin
    public.get_current_user_role() IN ('super_admin', 'admin')
    OR
    -- Allow users to update their own profile
    id = auth.uid()
  );
