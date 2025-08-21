/*
  # Revert pulsador distribution changes

  1. Changes
    - Remove pulsador_pequeno_qty column from order_items
    - Remove pulsador_grande_qty column from order_items
    - Remove related constraints
    
  2. Notes
    - This reverts all changes made for pulsador distribution
    - Keeps the original pulsador_type field intact
*/

-- Drop constraints first
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS pulsador_pequeno_qty_check;
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS pulsador_grande_qty_check;
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS pulsador_distribution_check;

-- Drop the new columns
ALTER TABLE order_items DROP COLUMN IF EXISTS pulsador_pequeno_qty;
ALTER TABLE order_items DROP COLUMN IF EXISTS pulsador_grande_qty;