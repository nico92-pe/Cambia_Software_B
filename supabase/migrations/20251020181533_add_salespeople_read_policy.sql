/*
  # Agregar política para permitir lectura de perfiles de vendedores

  1. Problema
    - Los usuarios no pueden ver la lista de vendedores al crear/editar clientes
    - Las políticas RLS actuales solo permiten:
      * Administradores ver todos los perfiles
      * Usuarios ver su propio perfil
    - Falta una política que permita a TODOS los usuarios autenticados ver perfiles con rol asesor_ventas

  2. Solución
    - Agregar política RLS que permite a todos los usuarios autenticados leer perfiles de vendedores
    - Esto es seguro porque la información de vendedores (nombre, cargo, teléfono) no es sensible
    - Es necesario para operaciones normales del sistema:
      * Asignar vendedores a clientes
      * Mostrar información de vendedores en pedidos
      * Generar reportes con datos de vendedores

  3. Seguridad
    - Solo permite lectura (SELECT), no modificación
    - Solo aplica a perfiles con rol asesor_ventas
    - Mantiene todas las demás restricciones de seguridad intactas
    - Los usuarios siguen sin poder ver datos sensibles de otros usuarios (admin, super_admin)

  4. Impacto
    - Restaura la funcionalidad de lista de vendedores en formulario de clientes
    - Permite a todos los usuarios (admin, vendedores) crear/editar clientes correctamente
    - No introduce ningún riesgo de seguridad
*/

-- Create policy to allow all authenticated users to read salespeople profiles
CREATE POLICY "Enable read access for salespeople profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    role = 'asesor_ventas'
  );