/*
  # Add reference field to clients table

  1. Changes
    - Add `reference` column to `clients` table as optional text field
    - This field will store location reference information for clients

  2. Security
    - No changes needed to RLS policies as this is just an additional field
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'reference'
  ) THEN
    ALTER TABLE clients ADD COLUMN reference text;
  END IF;
END $$;