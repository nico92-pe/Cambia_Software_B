/*
  # Create Products and Categories Tables

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `products`
      - `id` (uuid, primary key)
      - `code` (text, unique)
      - `name` (text)
      - `wholesale_price` (decimal)
      - `retail_price` (decimal)
      - `distributor_price` (decimal)
      - `credit_price` (decimal)
      - `cash_price` (decimal)
      - `units_per_box` (integer)
      - `category_id` (uuid, foreign key)
      - `stock` (integer)
      - `image_url` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read/write their data
    - Add policies for admins to manage all data

  3. Indexes
    - Add indexes for better query performance
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  wholesale_price decimal(10,2) NOT NULL DEFAULT 0,
  retail_price decimal(10,2) NOT NULL DEFAULT 0,
  distributor_price decimal(10,2) NOT NULL DEFAULT 0,
  credit_price decimal(10,2) NOT NULL DEFAULT 0,
  cash_price decimal(10,2) NOT NULL DEFAULT 0,
  units_per_box integer NOT NULL DEFAULT 1,
  category_id uuid REFERENCES categories(id) ON DELETE RESTRICT,
  stock integer DEFAULT 0,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Enable read access for authenticated users on categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for admins on categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Enable update access for admins on categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Enable delete access for admins on categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Create policies for products
CREATE POLICY "Enable read access for authenticated users on products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for admins on products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Enable update access for admins on products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Enable delete access for admins on products"
  ON products
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample categories
INSERT INTO categories (name) VALUES 
  ('Griferías de Cocina'),
  ('Griferías de Baño'),
  ('Accesorios de Baño'),
  ('Repuestos')
ON CONFLICT (name) DO NOTHING;

-- Insert sample products
INSERT INTO products (code, name, wholesale_price, retail_price, distributor_price, credit_price, cash_price, units_per_box, category_id, stock, image_url)
SELECT 
  'GC001',
  'Grifería de Cocina Premium',
  150.00,
  200.00,
  175.00,
  220.00,
  190.00,
  1,
  c.id,
  25,
  'https://images.pexels.com/photos/1358912/pexels-photo-1358912.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop'
FROM categories c WHERE c.name = 'Griferías de Cocina'
ON CONFLICT (code) DO NOTHING;

INSERT INTO products (code, name, wholesale_price, retail_price, distributor_price, credit_price, cash_price, units_per_box, category_id, stock, image_url)
SELECT 
  'GB001',
  'Grifería de Baño Moderna',
  120.00,
  160.00,
  140.00,
  180.00,
  150.00,
  1,
  c.id,
  30,
  'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop'
FROM categories c WHERE c.name = 'Griferías de Baño'
ON CONFLICT (code) DO NOTHING;

INSERT INTO products (code, name, wholesale_price, retail_price, distributor_price, credit_price, cash_price, units_per_box, category_id, stock, image_url)
SELECT 
  'AB001',
  'Set de Accesorios de Baño',
  80.00,
  120.00,
  100.00,
  140.00,
  110.00,
  4,
  c.id,
  40,
  'https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop'
FROM categories c WHERE c.name = 'Accesorios de Baño'
ON CONFLICT (code) DO NOTHING;