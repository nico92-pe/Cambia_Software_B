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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add comments for documentation
COMMENT ON TABLE public.clients IS 'Tabla de clientes del sistema';
COMMENT ON COLUMN public.clients.ruc IS 'RUC único del cliente';
COMMENT ON COLUMN public.clients.business_name IS 'Razón social del cliente';
COMMENT ON COLUMN public.clients.commercial_name IS 'Nombre comercial del cliente';
COMMENT ON COLUMN public.clients.salesperson_id IS 'ID del vendedor asignado al cliente';
COMMENT ON COLUMN public.clients.transport IS 'Nombre del transporte (para clientes fuera de Lima)';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_ruc ON public.clients(ruc);
CREATE INDEX IF NOT EXISTS idx_clients_salesperson ON public.clients(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_clients_province ON public.clients(province);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at DESC);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Policy: Salespeople can only see their own clients
CREATE POLICY "Salespeople can view their own clients"
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (
    salesperson_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Policy: Salespeople can only insert clients assigned to them
CREATE POLICY "Salespeople can create clients for themselves"
  ON public.clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    salesperson_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Policy: Salespeople can only update their own clients
CREATE POLICY "Salespeople can update their own clients"
  ON public.clients
  FOR UPDATE
  TO authenticated
  USING (
    salesperson_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    salesperson_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Policy: Only admins can delete clients
CREATE POLICY "Only admins can delete clients"
  ON public.clients
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Insert some sample data (optional - remove if not needed)
INSERT INTO public.clients (
  ruc,
  business_name,
  commercial_name,
  address,
  district,
  province,
  salesperson_id
) VALUES
(
  '20123456789',
  'EMPRESA EJEMPLO S.A.C.',
  'Empresa Ejemplo',
  'Av. Ejemplo 123',
  'San Isidro',
  'Lima',
  (SELECT id FROM public.profiles WHERE role = 'asesor_ventas' LIMIT 1)
),
(
  '20987654321',
  'COMERCIAL DEMO E.I.R.L.',
  'Comercial Demo',
  'Jr. Demo 456',
  'Miraflores',
  'Lima',
  (SELECT id FROM public.profiles WHERE role = 'asesor_ventas' LIMIT 1)
) ON CONFLICT (ruc) DO NOTHING;