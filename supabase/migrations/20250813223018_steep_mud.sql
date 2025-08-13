/*
  # Fix salesperson data integrity

  1. Create the missing salesperson profile
    - Create user account for María González
    - Create profile with asesor_ventas role
    - Use the ID that clients are already referencing

  2. Security
    - Enable RLS on profiles table (already enabled)
    - User will inherit existing policies
*/

-- First, let's create the auth user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '14e053fa-73a7-4657-a857-a6a54794259c',
  '00000000-0000-0000-0000-000000000000',
  'maria.gonzalez@griferiascambia.com',
  crypt('vendedor123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "María González", "phone": "+51 987 654 321", "cargo": "Asesor de Ventas Senior", "role": "asesor_ventas"}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Now create the profile
INSERT INTO profiles (
  id,
  full_name,
  phone,
  birthday,
  cargo,
  role,
  must_change_password,
  created_at,
  updated_at
) VALUES (
  '14e053fa-73a7-4657-a857-a6a54794259c',
  'María González',
  '+51 987 654 321',
  '1985-03-15',
  'Asesor de Ventas Senior',
  'asesor_ventas',
  true,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  birthday = EXCLUDED.birthday,
  cargo = EXCLUDED.cargo,
  role = EXCLUDED.role,
  updated_at = now();