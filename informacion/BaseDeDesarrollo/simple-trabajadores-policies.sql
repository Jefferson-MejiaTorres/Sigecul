-- SOLUCIÓN SIMPLE para políticas RLS de trabajadores
-- Si el script anterior no funciona, usar este más básico

-- =====================================
-- OPCIÓN SIMPLE: POLÍTICAS BÁSICAS
-- =====================================

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver trabajadores activos" ON public.trabajadores;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear trabajadores" ON public.trabajadores;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar trabajadores" ON public.trabajadores;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar trabajadores" ON public.trabajadores;

-- Política simple para SELECT - permite ver TODOS los trabajadores
CREATE POLICY "Allow authenticated users to view all workers"
ON public.trabajadores
FOR SELECT
TO authenticated
USING (true);

-- Política simple para INSERT
CREATE POLICY "Allow authenticated users to create workers"
ON public.trabajadores
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política simple para UPDATE - SIN restricciones en WITH CHECK
CREATE POLICY "Allow authenticated users to update workers"
ON public.trabajadores
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política simple para DELETE
CREATE POLICY "Allow authenticated users to delete workers"
ON public.trabajadores
FOR DELETE
TO authenticated
USING (true);

-- Habilitar RLS
ALTER TABLE public.trabajadores ENABLE ROW LEVEL SECURITY;

-- =====================================
-- ESTA SOLUCIÓN ES MÁS PERMISIVA PERO SOLUCIONA EL ERROR
-- Una vez que funcione, puedes refinar las políticas gradualmente
-- =====================================
