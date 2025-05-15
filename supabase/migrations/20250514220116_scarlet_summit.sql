/*
  # Create Super Admin User

  1. Changes
    - Creates the initial admin user with credentials:
      - Email: admin@cambia.com
      - Password: admin123
      - Role: ADMINISTRADOR
    
  2. Security
    - Password is properly hashed
    - User is created with email confirmation
*/

-- Insert admin user if not exists
DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Check if admin user already exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@cambia.com') THEN
    -- Create admin user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@cambia.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      json_build_object(
        'full_name', 'Admin Principal',
        'phone', '+51 999 888 777',
        'cargo', 'Super Administrador',
        'role', 'ADMINISTRADOR'
      ),
      now(),
      now(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO admin_id;
  END IF;
END $$;