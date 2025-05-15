/*
  # Correcciones a la tabla profiles

  1. Cambios
    - Agregar índice para búsquedas por email
    - Agregar políticas para administradores
    - Mejorar validaciones de campos
*/

-- Agregar índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Agregar política para que los administradores puedan ver todos los perfiles
CREATE POLICY "Administrators can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'ADMINISTRADOR'
    )
  );

-- Agregar política para que los administradores puedan actualizar todos los perfiles
CREATE POLICY "Administrators can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'ADMINISTRADOR'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'ADMINISTRADOR'
    )
  );

-- Mejorar validaciones de campos
ALTER TABLE profiles
  ADD CONSTRAINT phone_format CHECK (phone ~ '^\+51\s\d{3}\s\d{3}\s\d{3}$'),
  ADD CONSTRAINT full_name_not_empty CHECK (length(trim(full_name)) > 0),
  ADD CONSTRAINT cargo_not_empty CHECK (length(trim(cargo)) > 0);

-- Actualizar la función handle_new_user para manejar mejor los datos
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  formatted_phone TEXT;
BEGIN
  -- Formatear el número de teléfono
  formatted_phone := regexp_replace(
    NEW.raw_user_meta_data->>'phone',
    '^(\+51)?[\s-]?(\d{3})[\s-]?(\d{3})[\s-]?(\d{3})$',
    '+51 \2 \3 \4'
  );

  INSERT INTO public.profiles (
    id,
    full_name,
    phone,
    cargo,
    role,
    must_change_password
  )
  VALUES (
    NEW.id,
    trim(NEW.raw_user_meta_data->>'full_name'),
    formatted_phone,
    trim(NEW.raw_user_meta_data->>'cargo'),
    NEW.raw_user_meta_data->>'role',
    true
  );
  RETURN NEW;
END;
$$;