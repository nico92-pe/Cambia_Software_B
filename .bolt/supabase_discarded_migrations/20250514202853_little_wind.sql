/*
  # Initial Schema Setup

  1. Tables
    - Creates profiles table with user information
    - Links to auth.users table
    - Includes constraints for data validation

  2. Security
    - Enables RLS
    - Adds policies for user access control
    - Administrators can view and update all profiles
    - Users can only view and update their own profiles

  3. Automation
    - Adds trigger for automatic profile creation
    - Handles phone number formatting
    - Sets up indexing for performance
*/

-- Create profiles table
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

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Administrators can view all profiles" ON profiles;
  DROP POLICY IF EXISTS "Administrators can update all profiles" ON profiles;
END $$;

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

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

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
DROP INDEX IF EXISTS idx_profiles_role;
CREATE INDEX idx_profiles_role ON profiles(role);