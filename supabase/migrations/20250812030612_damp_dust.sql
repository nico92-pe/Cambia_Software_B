/*
  # Create clients table

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `ruc` (text, unique)
      - `business_name` (text)
      - `commercial_name` (text)
      - `address` (text)
      - `district` (text)
      - `province` (text)
      - `salesperson_id` (uuid, foreign key to profiles)
      - `transport` (text, optional)
      - `transport_address` (text, optional)
      - `transport_district` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `clients` table
    - Add policies for authenticated users based on salesperson_id or admin role
    - Add trigger for automatic updated_at updates

  3. Changes
    - Creates complete clients management system
    - Implements proper access control
    - Adds automatic timestamp management
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ruc text UNIQUE NOT NULL,
  business_name text NOT NULL,
  commercial_name text NOT NULL,
  address text NOT NULL,
  district text NOT NULL,
  province text NOT NULL,
  salesperson_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  transport text,
  transport_address text,
  transport_district text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users based on salesperson_id or role"
ON public.clients FOR SELECT TO authenticated USING (
  (salesperson_id = auth.uid()) OR
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')))
);

CREATE POLICY "Enable insert for authenticated users based on salesperson_id or role"
ON public.clients FOR INSERT TO authenticated WITH CHECK (
  (salesperson_id = auth.uid()) OR
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')))
);

CREATE POLICY "Enable update for authenticated users based on salesperson_id or role"
ON public.clients FOR UPDATE TO authenticated USING (
  (salesperson_id = auth.uid()) OR
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')))
) WITH CHECK (
  (salesperson_id = auth.uid()) OR
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')))
);

CREATE POLICY "Enable delete for authenticated users based on salesperson_id or role"
ON public.clients FOR DELETE TO authenticated USING (
  (salesperson_id = auth.uid()) OR
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')))
);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic updated_at updates
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_salesperson_id ON public.clients(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_clients_ruc ON public.clients(ruc);
CREATE INDEX IF NOT EXISTS idx_clients_province ON public.clients(province);