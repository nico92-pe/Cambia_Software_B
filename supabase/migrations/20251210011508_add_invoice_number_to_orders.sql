/*
  # Add invoice number field to orders

  1. Changes
    - Add `invoice_number` column to `orders` table
      - Nullable text field to store invoice/factura number
      - No uniqueness constraint to allow flexibility
  
  2. Notes
    - Only super_admin and admin can edit this field
    - Field is optional and can be updated after order creation
*/

-- Add invoice_number column to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'invoice_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN invoice_number text;
  END IF;
END $$;
