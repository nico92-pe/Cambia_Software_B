/*
  # Add pulsador_type column to order_items

  1. Changes
    - Add `pulsador_type` column to `order_items` table
    - Column allows NULL values since not all products require this selection
    - Add check constraint to ensure only valid pulsador types are stored

  2. Security
    - No changes to RLS policies needed as this is just adding a column
*/

-- Add pulsador_type column to order_items table
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS pulsador_type text;

-- Add check constraint to ensure only valid pulsador types
ALTER TABLE order_items 
ADD CONSTRAINT IF NOT EXISTS order_items_pulsador_type_check 
CHECK (pulsador_type IS NULL OR pulsador_type IN ('pequeño', 'grande'));

-- Add comment to the column for documentation
COMMENT ON COLUMN order_items.pulsador_type IS 'Tipo de pulsador para productos Kit Ahorrador: pequeño o grande';