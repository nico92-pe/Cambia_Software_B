/*
  # Add Contact 2 fields to clients table

  1. Changes
    - Add `contact_name_2` column to `clients` table (optional text field)
    - Add `contact_phone_2` column to `clients` table (optional text field)
  
  2. Security
    - No changes to RLS policies needed as these are just additional columns
*/

-- Add contact_name_2 column
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS contact_name_2 text;

-- Add contact_phone_2 column  
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS contact_phone_2 text;