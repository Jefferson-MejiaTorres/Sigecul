-- DEBUGGING: Políticas temporales para identificar el problema exacto
-- Ejecutar este script PASO A PASO en Supabase SQL Editor

-- ==========================================
-- PASO 1: Ver las políticas actuales
-- ==========================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'trabajadores';

-- ==========================================
-- PASO 2: Eliminar TODAS las políticas existentes
-- ==========================================
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver todos los trabajadores" ON public.trabajadores;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver trabajadores activos" ON public.trabajadores;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear trabajadores" ON public.trabajadores;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar trabajadores" ON public.trabajadores;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar trabajadores" ON public.trabajadores;

-- Eliminar cualquier política con nombres en inglés también
DROP POLICY IF EXISTS "Allow authenticated users to view all workers" ON public.trabajadores;
DROP POLICY IF EXISTS "Allow authenticated users to create workers" ON public.trabajadores;
DROP POLICY IF EXISTS "Allow authenticated users to update workers" ON public.trabajadores;
DROP POLICY IF EXISTS "Allow authenticated users to delete workers" ON public.trabajadores;

-- ==========================================
-- PASO 3: Crear políticas MUY SIMPLES para testing
-- ==========================================

-- Política SELECT - permite ver TODO sin restricciones
CREATE POLICY "debug_select_trabajadores"
ON public.trabajadores
FOR SELECT
TO public
USING (true);

-- Política UPDATE - permite actualizar TODO sin restricciones
CREATE POLICY "debug_update_trabajadores"
ON public.trabajadores
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Política INSERT - permite crear sin restricciones
CREATE POLICY "debug_insert_trabajadores"
ON public.trabajadores
FOR INSERT
TO public
WITH CHECK (true);

-- Política DELETE - permite eliminar sin restricciones
CREATE POLICY "debug_delete_trabajadores"
ON public.trabajadores
FOR DELETE
TO public
USING (true);

-- ==========================================
-- PASO 4: Verificar que RLS esté habilitado
-- ==========================================
ALTER TABLE public.trabajadores ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- PASO 5: Verificar las nuevas políticas
-- ==========================================
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'trabajadores';

-- ==========================================
-- INSTRUCCIONES:
-- ==========================================
-- 1. Ejecuta este script en Supabase SQL Editor
-- 2. Prueba actualizar un trabajador desde tu app
-- 3. Si funciona: el problema era las políticas complejas
-- 4. Si NO funciona: el problema es otra cosa (auth, código, etc.)
-- 5. Una vez identificado, podemos aplicar políticas más restrictivas
