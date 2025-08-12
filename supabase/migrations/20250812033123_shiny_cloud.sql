/*
  # Create clients table

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `ruc` (text, unique, required) - RUC del cliente
      - `business_name` (text, required) - Razón social
      - `commercial_name` (text, required) - Nombre comercial
      - `address` (text, required) - Dirección principal
      - `district` (text, required) - Distrito
      - `province` (text, required) - Provincia
      - `salesperson_id` (uuid, foreign key) - Vendedor asignado
      - `transport` (text, optional) - Nombre del transporte
      - `transport_address` (text, optional) - Dirección del transporte
      - `transport_district` (text, optional) - Distrito del transporte
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `clients` table
    - Add policies for salespeople to see only their clients
    - Add policies for admins to see all clients

  3. Indexes
    - Index on `ruc` for fast lookups
    - Index on `salesperson_id` for filtering by salesperson
    - Index on `province` for geographic filtering
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ruc text UNIQUE NOT NULL,
  business_name text NOT NULL,
  commercial_name text NOT NULL,
  address text NOT NULL,
  district text NOT NULL,
  province text NOT NULL,
  salesperson_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  transport text,
  transport_address text,
  transport_district text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_ruc ON clients(ruc);
CREATE INDEX IF NOT EXISTS idx_clients_salesperson ON clients(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_clients_province ON clients(province);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies

-- Policy for salespeople to see only their assigned clients
CREATE POLICY "Salespeople can view their assigned clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'asesor_ventas'
      AND clients.salesperson_id = profiles.id
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Policy for salespeople to insert clients assigned to them
CREATE POLICY "Salespeople can create clients assigned to them"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'asesor_ventas'
      AND clients.salesperson_id = profiles.id
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Policy for salespeople to update their assigned clients
CREATE POLICY "Salespeople can update their assigned clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'asesor_ventas'
      AND clients.salesperson_id = profiles.id
    )
    OR
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
      AND profiles.role = 'asesor_ventas'
      AND clients.salesperson_id = profiles.id
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Policy for admins to delete clients
CREATE POLICY "Admins can delete clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Add comments for documentation
COMMENT ON TABLE clients IS 'Tabla de clientes del sistema';
COMMENT ON COLUMN clients.ruc IS 'RUC único del cliente';
COMMENT ON COLUMN clients.business_name IS 'Razón social del cliente';
COMMENT ON COLUMN clients.commercial_name IS 'Nombre comercial del cliente';
COMMENT ON COLUMN clients.salesperson_id IS 'ID del vendedor asignado al cliente';
COMMENT ON COLUMN clients.transport IS 'Nombre del transporte (para provincias)';
COMMENT ON COLUMN clients.transport_address IS 'Dirección del transporte';
COMMENT ON COLUMN clients.transport_district IS 'Distrito del transporte';