/*
  # Update admin principal to super admin

  1. Changes
    - Convert admin principal to super admin role
    - Ensure proper super admin policies
*/

-- Update the admin principal to super admin
UPDATE profiles 
SET role = 'super_admin' 
WHERE email = 'admin@cambia.com';

-- Ensure RLS policies are correct for super admin
DROP POLICY IF EXISTS "Super admin can do everything" ON profiles;

CREATE POLICY "Super admin can do everything" ON profiles
  FOR ALL
  TO authenticated
  USING (role = 'super_admin')
  WITH CHECK (role = 'super_admin');