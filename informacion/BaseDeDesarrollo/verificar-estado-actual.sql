-- Script para verificar el estado actual de políticas y permisos
-- Ejecutar en Supabase SQL Editor para diagnóstico

-- ==========================================
-- 1. Ver todas las políticas de trabajadores
-- ==========================================
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'trabajadores'
ORDER BY cmd, policyname;

-- ==========================================
-- 2. Ver estructura de tabla trabajadores
-- ==========================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'trabajadores' 
ORDER BY ordinal_position;

-- ==========================================
-- 3. Ver algunos trabajadores de ejemplo
-- ==========================================
SELECT 
    id,
    nombre,
    activo,
    created_at
FROM public.trabajadores 
LIMIT 5;

-- ==========================================
-- 4. Ver usuarios en tabla usuarios
-- ==========================================
SELECT 
    id,
    email,
    nombre,
    rol,
    activo,
    auth_user_id
FROM public.usuarios 
LIMIT 5;

-- ==========================================
-- 5. Verificar si RLS está habilitado
-- ==========================================
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE tablename = 'trabajadores';

-- ==========================================
-- 6. Ver constraint checks de trabajadores
-- ==========================================
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%trabajadores%';

-- ==========================================
-- INSTRUCCIONES:
-- ==========================================
-- Ejecuta cada consulta y revisa los resultados.
-- Esto nos ayudará a identificar exactamente qué está causando el problema.
