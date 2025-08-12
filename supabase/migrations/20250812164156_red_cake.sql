/*
  # Create Orders System

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `salesperson_id` (uuid, foreign key to profiles)
      - `status` (enum: borrador, tomado, confirmado, en_preparacion, despachado)
      - `subtotal` (numeric)
      - `igv` (numeric)
      - `total` (numeric)
      - `observations` (text)
      - `created_by` (uuid, foreign key to profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `product_id` (uuid, foreign key to products)
      - `quantity` (integer)
      - `unit_price` (numeric)
      - `subtotal` (numeric)
      - `created_at` (timestamp)
    
    - `order_status_logs`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `status` (text)
      - `observations` (text)
      - `has_observations` (boolean)
      - `created_by` (uuid, foreign key to profiles)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on roles
*/

-- Create order status enum
CREATE TYPE order_status AS ENUM ('borrador', 'tomado', 'confirmado', 'en_preparacion', 'despachado');

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  salesperson_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status order_status NOT NULL DEFAULT 'borrador',
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  igv numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  observations text,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create order_status_logs table
CREATE TABLE IF NOT EXISTS order_status_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  observations text,
  has_observations boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_salesperson_id ON orders(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_status_logs_order_id ON order_status_logs(order_id);

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for orders table
CREATE POLICY "Enable read access for authenticated users on orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users on orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users on orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for admins on orders"
  ON orders FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'admin')
  ));

-- Create policies for order_items table
CREATE POLICY "Enable read access for authenticated users on order_items"
  ON order_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users on order_items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users on order_items"
  ON order_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users on order_items"
  ON order_items FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for order_status_logs table
CREATE POLICY "Enable read access for authenticated users on order_status_logs"
  ON order_status_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users on order_status_logs"
  ON order_status_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate order totals
CREATE OR REPLACE FUNCTION calculate_order_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate subtotal for the item
    NEW.subtotal = NEW.quantity * NEW.unit_price;
    
    -- Update order totals
    UPDATE orders SET
        total = (
            SELECT COALESCE(SUM(quantity * unit_price), 0)
            FROM order_items
            WHERE order_id = NEW.order_id
        ),
        subtotal = (
            SELECT COALESCE(SUM(quantity * unit_price), 0) / 1.18
            FROM order_items
            WHERE order_id = NEW.order_id
        ),
        igv = (
            SELECT (COALESCE(SUM(quantity * unit_price), 0) / 1.18) * 0.18
            FROM order_items
            WHERE order_id = NEW.order_id
        ),
        updated_at = now()
    WHERE id = NEW.order_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for order items
CREATE TRIGGER calculate_order_totals_trigger
    AFTER INSERT OR UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_order_totals();

-- Function to recalculate totals on item deletion
CREATE OR REPLACE FUNCTION recalculate_order_totals_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Update order totals after deletion
    UPDATE orders SET
        total = (
            SELECT COALESCE(SUM(quantity * unit_price), 0)
            FROM order_items
            WHERE order_id = OLD.order_id
        ),
        subtotal = (
            SELECT COALESCE(SUM(quantity * unit_price), 0) / 1.18
            FROM order_items
            WHERE order_id = OLD.order_id
        ),
        igv = (
            SELECT (COALESCE(SUM(quantity * unit_price), 0) / 1.18) * 0.18
            FROM order_items
            WHERE order_id = OLD.order_id
        ),
        updated_at = now()
    WHERE id = OLD.order_id;
    
    RETURN OLD;
END;
$$ language 'plpgsql';

-- Create trigger for order item deletion
CREATE TRIGGER recalculate_order_totals_on_delete_trigger
    AFTER DELETE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_order_totals_on_delete();