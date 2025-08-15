/*
  # Add payment terms to orders

  1. New Columns
    - `payment_type` - 'contado' or 'credito'
    - `credit_type` - 'factura' or 'letras' (only for credit orders)
    - `installments` - number of installments (only for credit orders)

  2. New Table
    - `order_installments` - stores installment details for credit orders

  3. Security
    - Enable RLS on order_installments table
    - Add policies for order installments access
*/

-- Add payment terms columns to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_type'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_type text DEFAULT 'contado' CHECK (payment_type IN ('contado', 'credito'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'credit_type'
  ) THEN
    ALTER TABLE orders ADD COLUMN credit_type text CHECK (credit_type IN ('factura', 'letras'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'installments'
  ) THEN
    ALTER TABLE orders ADD COLUMN installments integer;
  END IF;
END $$;

-- Create order_installments table
CREATE TABLE IF NOT EXISTS order_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  installment_number integer NOT NULL,
  amount decimal(10,2) NOT NULL,
  due_date date NOT NULL,
  days_due integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT positive_installment_number CHECK (installment_number > 0),
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT positive_days_due CHECK (days_due >= 0),
  UNIQUE(order_id, installment_number)
);

-- Enable RLS
ALTER TABLE order_installments ENABLE ROW LEVEL SECURITY;

-- Create policies for order_installments
CREATE POLICY "Users can view installments for orders they can access"
  ON order_installments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_installments.order_id
    )
  );

CREATE POLICY "Users can insert installments for orders they can create"
  ON order_installments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_installments.order_id
    )
  );

CREATE POLICY "Users can update installments for orders they can modify"
  ON order_installments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_installments.order_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_installments.order_id
    )
  );

CREATE POLICY "Users can delete installments for orders they can modify"
  ON order_installments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_installments.order_id
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_installments_order_id ON order_installments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_installments_due_date ON order_installments(due_date);