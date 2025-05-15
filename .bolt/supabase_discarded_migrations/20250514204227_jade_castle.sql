/*
  # Initial Schema Setup
  
  1. Tables
    - Creates profiles table with user information
    - Links to auth.users table
    - Includes validation constraints for data integrity
  
  2. Security
    - Enables RLS on profiles table
    - Adds policies for user access control
    - Creates function and trigger for automatic profile creation
  
  3. Performance
    - Adds index on role column for faster lookups
*/

-- Create profiles table first
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  birthday date,
  cargo text NOT NULL,
  role text NOT NULL CHECK (role IN ('ADMINISTRADOR', 'LOGISTICA', 'ASESOR_VENTAS')),
  must_change_password boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT phone_format CHECK (phone ~ '^\+51\s\d{3}\s\d{3}\s\d{3}$'),
  CONSTRAINT full_name_not_empty CHECK (length(trim(full_name)) > 0),
  CONSTRAINT cargo_not_empty CHECK (length(trim(cargo)) > 0)
);

-- Now that the table exists, we can manage its policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Administrators can view all profiles" ON profiles;
  DROP POLICY IF EXISTS "Administrators can update all profiles" ON profiles;
  
  -- Drop existing trigger if it exists
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  
  -- Drop existing function if it exists
  DROP FUNCTION IF EXISTS handle_new_user();
  
  -- Drop existing index if it exists
  DROP INDEX IF EXISTS idx_profiles_role;
END $$;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Administrators can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'ADMINISTRADOR'
    )
  );

CREATE POLICY "Administrators can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'ADMINISTRADOR'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'ADMINISTRADOR'
    )
  );

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  formatted_phone TEXT;
BEGIN
  -- Format phone number
  formatted_phone := regexp_replace(
    NEW.raw_user_meta_data->>'phone',
    '^(\+51)?[\s-]?(\d{3})[\s-]?(\d{3})[\s-]?(\d{3})$',
    '+51 \2 \3 \4'
  );

  INSERT INTO public.profiles (
    id,
    full_name,
    phone,
    cargo,
    role,
    must_change_password
  )
  VALUES (
    NEW.id,
    trim(NEW.raw_user_meta_data->>'full_name'),
    formatted_phone,
    trim(NEW.raw_user_meta_data->>'cargo'),
    NEW.raw_user_meta_data->>'role',
    true
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create index for role lookups
CREATE INDEX idx_profiles_role ON profiles(role);