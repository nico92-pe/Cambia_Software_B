/*
  # Esquema para tabla de Clientes

  1. Nueva tabla: `clients`
     - `id` (uuid, primary key)
     - `ruc` (text, unique, required) - RUC del cliente
     - `business_name` (text, required) - Razón social
     - `commercial_name` (text, required) - Nombre comercial
     - `address` (text, required) - Dirección principal
     - `district` (text, required) - Distrito
     - `province` (text, required) - Provincia
     - `salesperson_id` (uuid, foreign key) - Referencia al vendedor asignado
     - `transport` (text, optional) - Nombre del transporte (para provincias)
     - `transport_address` (text, optional) - Dirección del transporte
     - `transport_district` (text, optional) - Distrito del transporte
     - `created_at` (timestamp)
     - `updated_at` (timestamp)

  2. Seguridad (RLS)
     - Los asesores de ventas solo pueden ver/editar sus propios clientes
     - Los admins pueden ver/editar todos los clientes

  3. Índices para mejor rendimiento
     - Índice en salesperson_id
     - Índice en province
     - Índice único en ruc
*/

-- Crear la tabla clients
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

-- Habilitar Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: Los asesores ven sus clientes, los admins ven todos
CREATE POLICY "Enable read access for clients based on role and assignment"
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (
    -- El asesor de ventas puede ver sus propios clientes
    (salesperson_id = auth.uid()) OR
    -- Los admins y super admins pueden ver todos los clientes
    (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    ))
  );

-- Política para INSERT: Los asesores pueden crear clientes asignados a ellos, los admins pueden crear cualquier cliente
CREATE POLICY "Enable insert for clients based on role and assignment"
  ON public.clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- El asesor de ventas puede crear clientes asignados a él mismo
    (salesperson_id = auth.uid()) OR
    -- Los admins y super admins pueden crear clientes con cualquier asignación
    (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    ))
  );

-- Política para UPDATE: Los asesores pueden actualizar sus clientes, los admins pueden actualizar cualquier cliente
CREATE POLICY "Enable update for clients based on role and assignment"
  ON public.clients
  FOR UPDATE
  TO authenticated
  USING (
    -- El asesor de ventas puede actualizar sus propios clientes
    (salesperson_id = auth.uid()) OR
    -- Los admins y super admins pueden actualizar cualquier cliente
    (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    ))
  )
  WITH CHECK (
    -- Mismas reglas para el CHECK
    (salesperson_id = auth.uid()) OR
    (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    ))
  );

-- Política para DELETE: Los asesores pueden eliminar sus clientes, los admins pueden eliminar cualquier cliente
CREATE POLICY "Enable delete for clients based on role and assignment"
  ON public.clients
  FOR DELETE
  TO authenticated
  USING (
    -- El asesor de ventas puede eliminar sus propios clientes
    (salesperson_id = auth.uid()) OR
    -- Los admins y super admins pueden eliminar cualquier cliente
    (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    ))
  );

-- Función para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_clients_salesperson_id ON public.clients(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_clients_province ON public.clients(province);
CREATE INDEX IF NOT EXISTS idx_clients_ruc ON public.clients(ruc);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at DESC);

-- Comentarios para documentación
COMMENT ON TABLE public.clients IS 'Tabla para almacenar información de clientes de la empresa';
COMMENT ON COLUMN public.clients.ruc IS 'RUC único del cliente (11 dígitos)';
COMMENT ON COLUMN public.clients.business_name IS 'Razón social oficial del cliente';
COMMENT ON COLUMN public.clients.commercial_name IS 'Nombre comercial del cliente';
COMMENT ON COLUMN public.clients.salesperson_id IS 'ID del asesor de ventas asignado al cliente';
COMMENT ON COLUMN public.clients.transport IS 'Nombre de la empresa de transporte (para clientes de provincia)';
COMMENT ON COLUMN public.clients.transport_address IS 'Dirección de la empresa de transporte';
COMMENT ON COLUMN public.clients.transport_district IS 'Distrito de la empresa de transporte';