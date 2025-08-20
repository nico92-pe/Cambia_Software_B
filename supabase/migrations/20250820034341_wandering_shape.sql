/*
  # Add contact fields to clients table

  1. Changes
    - Add `contact_name` column to clients table (required)
    - Add `contact_phone` column to clients table (required)
    
  2. Notes
    - These fields store the primary contact person information for each client
    - Both fields are required (NOT NULL)
*/

-- Add contact_name column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'contact_name'
  ) THEN
    ALTER TABLE clients ADD COLUMN contact_name text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Add contact_phone column  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'contact_phone'
  ) THEN
    ALTER TABLE clients ADD COLUMN contact_phone text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Remove default values after adding columns
ALTER TABLE clients ALTER COLUMN contact_name DROP DEFAULT;
ALTER TABLE clients ALTER COLUMN contact_phone DROP DEFAULT;