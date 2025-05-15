/*
  # Fix recursive policies for profiles table

  1. Changes
    - Drop existing policies that cause recursion
    - Create new non-recursive policies for administrators and users
    
  2. Security
    - Maintain RLS enabled on profiles table
    - Add new policies that avoid recursive checks
    - Ensure administrators can still manage all profiles
    - Ensure users can still manage their own profiles
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Administrators can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Administrators can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new non-recursive policies
CREATE POLICY "Enable read access for administrators"
ON profiles
FOR SELECT
TO authenticated
USING (
  role = 'ADMINISTRADOR'
  OR id = auth.uid()
);

CREATE POLICY "Enable update access for administrators"
ON profiles
FOR UPDATE
TO authenticated
USING (
  role = 'ADMINISTRADOR'
  OR id = auth.uid()
)
WITH CHECK (
  role = 'ADMINISTRADOR'
  OR id = auth.uid()
);