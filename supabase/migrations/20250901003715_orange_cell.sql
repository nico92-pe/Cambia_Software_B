/*
  # Remove credit_price and cash_price columns from products table

  1. Changes
    - Remove `credit_price` column from products table
    - Remove `cash_price` column from products table

  2. Notes
    - These columns are no longer needed in the application
    - Data will be permanently removed
*/

-- Remove credit_price column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'credit_price'
  ) THEN
    ALTER TABLE products DROP COLUMN credit_price;
  END IF;
END $$;

-- Remove cash_price column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'cash_price'
  ) THEN
    ALTER TABLE products DROP COLUMN cash_price;
  END IF;
END $$;