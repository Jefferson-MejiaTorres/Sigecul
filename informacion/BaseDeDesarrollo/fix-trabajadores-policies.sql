-- FIX para políticas RLS de trabajadores
-- Ejecutar este script en el editor SQL de Supabase para solucionar el error de RLS

-- =====================================
-- PASO 1: ELIMINAR POLÍTICAS EXISTENTES
-- =====================================

-- Eliminar todas las políticas existentes de trabajadores
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver trabajadores activos" ON public.trabajadores;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear trabajadores" ON public.trabajadores;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar trabajadores" ON public.trabajadores;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar trabajadores" ON public.trabajadores;

-- =====================================
-- PASO 2: CREAR POLÍTICAS CORREGIDAS
-- =====================================

-- Policy para SELECT (permitir ver TODOS los trabajadores, activos e inactivos)
CREATE POLICY "Usuarios autenticados pueden ver todos los trabajadores"
ON public.trabajadores
FOR SELECT
TO public
USING (
  auth.uid() IS NOT NULL
);

-- Policy para INSERT (permitir crear trabajadores)
CREATE POLICY "Usuarios autenticados pueden crear trabajadores"
ON public.trabajadores
FOR INSERT
TO public
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE usuarios.auth_user_id = auth.uid()
      AND usuarios.activo = true
      AND usuarios.rol IN ('supervisor', 'admin', 'president')
  )
);

-- Policy para UPDATE (permitir actualizar trabajadores)
CREATE POLICY "Usuarios autenticados pueden actualizar trabajadores"
ON public.trabajadores
FOR UPDATE
TO public
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE usuarios.auth_user_id = auth.uid()
      AND usuarios.activo = true
      AND usuarios.rol IN ('supervisor', 'admin', 'president')
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE usuarios.auth_user_id = auth.uid()
      AND usuarios.activo = true
      AND usuarios.rol IN ('supervisor', 'admin', 'president')
  )
);

-- Policy para DELETE (permitir eliminar trabajadores - solo roles específicos)
CREATE POLICY "Usuarios autenticados pueden eliminar trabajadores"
ON public.trabajadores
FOR DELETE
TO public
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE usuarios.auth_user_id = auth.uid()
      AND usuarios.activo = true
      AND usuarios.rol IN ('admin', 'president')
  )
);

-- =====================================
-- PASO 3: VERIFICAR QUE RLS ESTÁ HABILITADO
-- =====================================

-- Asegurar que RLS está habilitado
ALTER TABLE public.trabajadores ENABLE ROW LEVEL SECURITY;

-- =====================================
-- NOTAS IMPORTANTES:
-- =====================================
-- 1. Las nuevas políticas permiten ver TODOS los trabajadores (activos e inactivos)
-- 2. Solo usuarios con roles específicos pueden crear/actualizar/eliminar
-- 3. La política UPDATE ahora permite cambiar el campo 'activo' sin restricciones
-- 4. Se mantiene la seguridad verificando los roles del usuario
