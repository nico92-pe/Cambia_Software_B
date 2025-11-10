/*
  # Add indexes for product search optimization

  1. Performance Improvements
    - Add B-tree index on products.name for faster text searches
    - Add B-tree index on products.code for faster code lookups
    - Add composite index on (category_id, name) for filtered searches
    
  2. Expected Impact
    - Reduce query time from 2-3 seconds to <500ms
    - Optimize ILIKE searches on name and code columns
    - Improve category-filtered product searches
*/

-- Create index for product name searches (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_products_name_lower 
ON products (LOWER(name));

-- Create index for product code searches (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_products_code_lower 
ON products (LOWER(code));

-- Create composite index for category + name filtering
CREATE INDEX IF NOT EXISTS idx_products_category_name 
ON products (category_id, name);

-- Add index for ordering by name
CREATE INDEX IF NOT EXISTS idx_products_name 
ON products (name);