/*
  # Remove pulsador_type field from order_items

  1. Changes
    - Remove pulsador_type column from order_items table
    - Clean up any related constraints or indexes
    
  2. Notes
    - This completely removes pulsador functionality from the database
    - Existing data in this column will be lost
*/

-- Remove the pulsador_type column from order_items table
ALTER TABLE order_items DROP COLUMN IF EXISTS pulsador_type;