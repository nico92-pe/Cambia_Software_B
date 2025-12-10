/*
  # Add Payment Status to Order Installments

  1. Changes
    - Add `status` column to `order_installments` table
      - Values: 'pendiente', 'vencida', 'pagada_parcial', 'pagada'
      - Default: 'pendiente'
    - Add `paid_amount` column to track how much has been paid
    - Add `payment_date` column to track when payment was made
    - Add `notes` column for payment notes/observations
    - Add indexes for better query performance
    - Create function to automatically update status based on due date and payments

  2. Security
    - No changes to RLS policies needed (inherits from existing table policies)

  3. Data Migration
    - Set all existing installments to 'pendiente' status
    - Set paid_amount to 0 for existing records
*/

-- Add new columns to order_installments table
DO $$
BEGIN
  -- Add status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_installments' AND column_name = 'status'
  ) THEN
    ALTER TABLE order_installments 
    ADD COLUMN status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'vencida', 'pagada_parcial', 'pagada'));
  END IF;

  -- Add paid_amount column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_installments' AND column_name = 'paid_amount'
  ) THEN
    ALTER TABLE order_installments 
    ADD COLUMN paid_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL;
  END IF;

  -- Add payment_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_installments' AND column_name = 'payment_date'
  ) THEN
    ALTER TABLE order_installments 
    ADD COLUMN payment_date TIMESTAMPTZ;
  END IF;

  -- Add notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_installments' AND column_name = 'notes'
  ) THEN
    ALTER TABLE order_installments 
    ADD COLUMN notes TEXT;
  END IF;

  -- Add updated_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_installments' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE order_installments 
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_order_installments_status ON order_installments(status);
CREATE INDEX IF NOT EXISTS idx_order_installments_due_date ON order_installments(due_date);
CREATE INDEX IF NOT EXISTS idx_order_installments_order_id_status ON order_installments(order_id, status);

-- Update existing records to have default values
UPDATE order_installments 
SET 
  status = 'pendiente',
  paid_amount = 0,
  updated_at = now()
WHERE status IS NULL;

-- Create function to automatically update vencida status based on due date
CREATE OR REPLACE FUNCTION update_installment_status()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update status to 'vencida' for unpaid installments past due date
  UPDATE order_installments
  SET 
    status = 'vencida',
    updated_at = now()
  WHERE 
    status IN ('pendiente', 'pagada_parcial')
    AND due_date < CURRENT_DATE
    AND paid_amount < amount;
END;
$$;

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_installment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_order_installments_updated_at ON order_installments;

CREATE TRIGGER update_order_installments_updated_at
  BEFORE UPDATE ON order_installments
  FOR EACH ROW
  EXECUTE FUNCTION update_installment_updated_at();