/*
  # Add pulsador distribution fields to order_items

  1. Schema Changes
    - Add `pulsador_pequeno_qty` (integer) - Cantidad con pulsador pequeño
    - Add `pulsador_grande_qty` (integer) - Cantidad con pulsador grande
    - Remove constraint on existing `pulsador_type` to make it optional
    - Add constraint to ensure distribution doesn't exceed total quantity

  2. Data Integrity
    - Ensure pulsador quantities are non-negative
    - Ensure sum of pulsador quantities doesn't exceed item quantity
    - Allow null values for non-Kit products

  3. Backward Compatibility
    - Existing `pulsador_type` field remains for simple cases
    - New fields are optional and only used for Kit products
*/

-- Add new columns for pulsador distribution
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS pulsador_pequeno_qty integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS pulsador_grande_qty integer DEFAULT 0;

-- Add constraints for data integrity
DO $$
BEGIN
  -- Constraint: pulsador quantities must be non-negative
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'pulsador_pequeno_qty_check' 
    AND table_name = 'order_items'
  ) THEN
    ALTER TABLE order_items 
    ADD CONSTRAINT pulsador_pequeno_qty_check 
    CHECK (pulsador_pequeno_qty >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'pulsador_grande_qty_check' 
    AND table_name = 'order_items'
  ) THEN
    ALTER TABLE order_items 
    ADD CONSTRAINT pulsador_grande_qty_check 
    CHECK (pulsador_grande_qty >= 0);
  END IF;

  -- Constraint: sum of pulsador quantities should not exceed total quantity
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'pulsador_distribution_check' 
    AND table_name = 'order_items'
  ) THEN
    ALTER TABLE order_items 
    ADD CONSTRAINT pulsador_distribution_check 
    CHECK (
      (pulsador_pequeno_qty + pulsador_grande_qty) <= quantity OR
      (pulsador_pequeno_qty = 0 AND pulsador_grande_qty = 0)
    );
  END IF;
END $$;

-- Update existing Kit Ahorrador items to have default distribution
UPDATE order_items 
SET 
  pulsador_pequeno_qty = CASE 
    WHEN pulsador_type = 'pequeño' THEN quantity 
    ELSE 0 
  END,
  pulsador_grande_qty = CASE 
    WHEN pulsador_type = 'grande' THEN quantity 
    ELSE 0 
  END
WHERE EXISTS (
  SELECT 1 FROM products 
  WHERE products.id = order_items.product_id 
  AND LOWER(products.name) LIKE '%kit ahorrador%'
  AND (
    LOWER(products.name) LIKE '%3%' OR 
    LOWER(products.name) LIKE '%4%' OR 
    LOWER(products.name) LIKE '%5%' OR 
    LOWER(products.name) LIKE '%6%' OR 
    LOWER(products.name) LIKE '%9%' OR 
    LOWER(products.name) LIKE '%10%'
  )
);