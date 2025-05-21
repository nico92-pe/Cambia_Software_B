-- Update the admin principal to super admin
UPDATE profiles 
SET role = 'SUPER_ADMIN' 
WHERE email = 'admin@cambia.com';

-- Ensure RLS policies are correct for super admin
DROP POLICY IF EXISTS "Super admin can do everything" ON profiles;

CREATE POLICY "Super admin can do everything" ON profiles
  FOR ALL
  TO authenticated
  USING (role = 'SUPER_ADMIN'::text)
  WITH CHECK (role = 'SUPER_ADMIN'::text);