-- Políticas RLS para la tabla trabajadores
-- Este archivo debe ejecutarse en el editor SQL de Supabase para habilitar las políticas de seguridad

-- Habilitar RLS en la tabla trabajadores (si no está habilitado)
ALTER TABLE public.trabajadores ENABLE ROW LEVEL SECURITY;

-- =====================
-- Tabla: trabajadores
-- =====================

-- Policy para SELECT (permitir a todos los usuarios autenticados ver trabajadores activos)
CREATE POLICY "Usuarios autenticados pueden ver trabajadores activos"
ON public.trabajadores
FOR SELECT
TO public
USING (
  auth.uid() IS NOT NULL 
  AND (activo IS NULL OR activo = true)
);

-- Policy para INSERT (permitir a usuarios autenticados crear trabajadores)
CREATE POLICY "Usuarios autenticados pueden crear trabajadores"
ON public.trabajadores
FOR INSERT
TO public
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Policy para UPDATE (permitir a usuarios autenticados actualizar trabajadores)
CREATE POLICY "Usuarios autenticados pueden actualizar trabajadores"
ON public.trabajadores
FOR UPDATE
TO public
USING (
  auth.uid() IS NOT NULL
)
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Policy para DELETE (permitir a usuarios autenticados eliminar trabajadores - opcional)
CREATE POLICY "Usuarios autenticados pueden eliminar trabajadores"
ON public.trabajadores
FOR DELETE
TO public
USING (
  auth.uid() IS NOT NULL
);

-- Nota: Si quieres políticas más estrictas basadas en roles, puedes usar algo como:
-- 
-- CREATE POLICY "Solo supervisores pueden gestionar trabajadores"
-- ON public.trabajadores
-- FOR ALL
-- TO public
-- USING (
--   EXISTS (
--     SELECT 1 FROM usuarios
--     WHERE usuarios.auth_user_id = auth.uid()
--       AND usuarios.rol IN ('supervisor', 'admin', 'president')
--       AND usuarios.activo = true
--   )
-- );
