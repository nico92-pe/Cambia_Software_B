-- Create profile for admin user if it doesn't exist
DO $$
DECLARE
  admin_user auth.users%ROWTYPE;
BEGIN
  -- Get admin user
  SELECT * INTO admin_user
  FROM auth.users
  WHERE email = 'admin@cambia.com'
  LIMIT 1;

  -- Create profile if user exists but profile doesn't
  IF admin_user.id IS NOT NULL AND 
     NOT EXISTS (SELECT 1 FROM profiles WHERE id = admin_user.id) THEN
    
    INSERT INTO profiles (
      id,
      full_name,
      phone,
      cargo,
      role,
      must_change_password,
      created_at,
      updated_at
    ) VALUES (
      admin_user.id,
      'Admin Principal',
      '+51 999 888 777',
      'Super Administrador',
      'ADMINISTRADOR',
      false,
      admin_user.created_at,
      admin_user.updated_at
    );
  END IF;
END $$;