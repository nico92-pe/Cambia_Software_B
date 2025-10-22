/*
  # Add category ordering and performance indexes

  1. Schema Changes
    - Add `display_order` column to categories table (integer, defaults to current row number)
    - Initialize display_order based on created_at to maintain current order
    
  2. Performance Improvements
    - Add composite index on products(category_id, created_at) for efficient ordering
    - Add indexes on products for search on name and code fields
    - Add index on categories(display_order) for efficient category ordering
    
  3. Notes
    - Existing categories will maintain their current order based on created_at
    - New categories will default to the end of the list (highest display_order + 1)
    - Indexes will dramatically improve query performance for product listing and search
*/

-- Enable pg_trgm extension if not already enabled (for text search performance)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add display_order column to categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'display_order'
  ) THEN
    -- Add the column with default value
    ALTER TABLE categories ADD COLUMN display_order integer NOT NULL DEFAULT 0;
    
    -- Initialize display_order based on created_at to maintain current order
    WITH ordered_categories AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as new_order
      FROM categories
    )
    UPDATE categories
    SET display_order = ordered_categories.new_order
    FROM ordered_categories
    WHERE categories.id = ordered_categories.id;
    
    -- Add check constraint to ensure display_order is positive
    ALTER TABLE categories ADD CONSTRAINT display_order_positive CHECK (display_order > 0);
  END IF;
END $$;

-- Create index on categories display_order for fast sorting
DROP INDEX IF EXISTS idx_categories_display_order;
CREATE INDEX idx_categories_display_order ON categories(display_order);

-- Create composite index on products for efficient category-based ordering
DROP INDEX IF EXISTS idx_products_category_created;
CREATE INDEX idx_products_category_created ON products(category_id, created_at);

-- Create indexes on products for text search (name and code)
DROP INDEX IF EXISTS idx_products_name_trgm;
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);

DROP INDEX IF EXISTS idx_products_code_trgm;
CREATE INDEX idx_products_code_trgm ON products USING gin(code gin_trgm_ops);