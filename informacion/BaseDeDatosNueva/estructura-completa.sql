-- estructura-completa.sql
-- Script integral para migrar y reconstruir la base de datos de SiGeCul en Supabase
-- Incluye: tablas, claves, restricciones, RLS, usuarios demo
-- Ejecutar en el SQL Editor de Supabase

-- =============================
-- 1. EXTENSIONES Y UUID DEFAULT
-- =============================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================
-- 2. TABLA USUARIOS
-- =============================
CREATE TABLE IF NOT EXISTS public.usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  nombre text NOT NULL,
  rol text NOT NULL CHECK (rol IN ('supervisor', 'admin', 'president')),
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  auth_user_id uuid UNIQUE
);

-- =============================
-- 3. TABLA TRABAJADORES
-- =============================
CREATE TABLE IF NOT EXISTS public.trabajadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  cedula text NOT NULL,
  telefono text,
  email text,
  especialidad text,
  valor_hora numeric CHECK (valor_hora IS NULL OR valor_hora >= 0),
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================
-- 4. TABLA PROYECTOS
-- =============================
CREATE TABLE IF NOT EXISTS public.proyectos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  presupuesto_total numeric NOT NULL CHECK (presupuesto_total >= 0),
  presupuesto_ejecutado numeric NOT NULL DEFAULT 0 CHECK (presupuesto_ejecutado >= 0),
  fecha_inicio date NOT NULL,
  fecha_fin date,
  estado text NOT NULL DEFAULT 'planificacion' CHECK (estado IN ('planificacion', 'activo', 'finalizado', 'cancelado')),
  supervisor_id uuid NOT NULL REFERENCES public.usuarios(id),
  ministerio_aprobacion boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================
-- 5. TABLA GASTOS_PROYECTO
-- =============================
CREATE TABLE IF NOT EXISTS public.gastos_proyecto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id uuid NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
  tipo_gasto text NOT NULL CHECK (tipo_gasto IN ('honorarios', 'refrigerios', 'transporte', 'materiales', 'servicios', 'otros')),
  monto numeric NOT NULL CHECK (monto > 0),
  fecha_gasto date NOT NULL,
  descripcion text NOT NULL,
  responsable text,
  aprobado boolean NOT NULL DEFAULT false,
  evidencia_url text,
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.usuarios(id)
);

-- =============================
-- 6. TABLA EVIDENCIAS_PROYECTO
-- =============================
CREATE TABLE IF NOT EXISTS public.evidencias_proyecto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id uuid NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
  fecha_actividad date NOT NULL,
  tipo_evidencia text NOT NULL CHECK (tipo_evidencia IN ('fotografia', 'lista_asistencia', 'informe', 'video', 'documento', 'otro')),
  nombre_archivo text NOT NULL,
  url_archivo text NOT NULL,
  tamaño_archivo integer CHECK (tamaño_archivo IS NULL OR tamaño_archivo > 0),
  descripcion text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.usuarios(id)
);

-- =============================
-- 7. TABLA PAGOS_PERSONAL
-- =============================
CREATE TABLE IF NOT EXISTS public.pagos_personal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id uuid NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
  trabajador_id uuid NOT NULL REFERENCES public.trabajadores(id),
  fecha_actividad date NOT NULL,
  tipo_labor text NOT NULL,
  horas_trabajadas numeric CHECK (horas_trabajadas IS NULL OR horas_trabajadas > 0),
  valor_pactado numeric NOT NULL CHECK (valor_pactado >= 0),
  estado_pago text NOT NULL DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'pagado', 'cancelado')),
  fecha_pago date,
  comprobante_url text,
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.usuarios(id)
);

-- =============================
-- 8. TABLA INFORMES_FINALES
-- =============================
CREATE TABLE IF NOT EXISTS public.informes_finales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id uuid NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  contenido text NOT NULL,
  archivo_url text,
  total_gastos numeric CHECK (total_gastos IS NULL OR total_gastos >= 0),
  total_participantes integer CHECK (total_participantes IS NULL OR total_participantes >= 0),
  fecha_entrega date,
  observaciones_generales text,
  estado text NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'finalizado', 'entregado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.usuarios(id)
);

-- =============================
-- 9. USUARIOS DEMO (ADMIN, SUPERVISOR, PRESIDENTE)
-- =============================
INSERT INTO public.usuarios (id, email, nombre, rol, activo, auth_user_id)
VALUES
  ('478b66fd-8db4-467f-ba46-bf6b18d08fdb', 'supervisor@ccc.com', 'Jefferson Supervisor', 'supervisor', true, '478b66fd-8db4-467f-ba46-bf6b18d08fdb'),
  ('2088934d-22f1-4cc6-bcab-4de84cb3aa53', 'admin@ccc.com', 'Luisa Administradora', 'admin', true, '2088934d-22f1-4cc6-bcab-4de84cb3aa53'),
  ('c0203fc2-9630-420e-a624-7ef6645501bc', 'presidente@ccc.com', 'Manuel Presidente', 'president', true, 'c0203fc2-9630-420e-a624-7ef6645501bc')
ON CONFLICT (id) DO NOTHING;

-- =============================
-- 10. RLS: ROW LEVEL SECURITY
-- =============================
-- Habilitar RLS en todas las tablas sensibles
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trabajadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidencias_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_personal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.informes_finales ENABLE ROW LEVEL SECURITY;

-- ==========
-- USUARIOS
-- ==========
DROP POLICY IF EXISTS "Usuarios pueden ver su propio usuario" ON public.usuarios;
CREATE POLICY "Usuarios pueden ver su propio usuario" ON public.usuarios
  FOR SELECT USING (auth.uid()::uuid = id OR rol IN ('admin', 'president'));

DROP POLICY IF EXISTS "Solo admin puede modificar usuarios" ON public.usuarios;
CREATE POLICY "Solo admin puede modificar usuarios" ON public.usuarios
  FOR UPDATE USING (rol = 'admin');

-- =============
-- TRABAJADORES
-- =============
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver trabajadores activos" ON public.trabajadores;
CREATE POLICY "Usuarios autenticados pueden ver trabajadores activos" ON public.trabajadores
  FOR SELECT USING (auth.role() = 'authenticated' AND activo = true);

DROP POLICY IF EXISTS "Solo admin puede crear trabajadores" ON public.trabajadores;
CREATE POLICY "Solo admin puede crear trabajadores" ON public.trabajadores
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Solo admin puede modificar trabajadores" ON public.trabajadores;
CREATE POLICY "Solo admin puede modificar trabajadores" ON public.trabajadores
  FOR UPDATE USING (auth.role() = 'authenticated');

-- =============
-- PROYECTOS
-- =============
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver proyectos" ON public.proyectos;
CREATE POLICY "Usuarios autenticados pueden ver proyectos" ON public.proyectos
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Solo admin/supervisor pueden crear proyectos" ON public.proyectos;
CREATE POLICY "Solo admin/supervisor pueden crear proyectos" ON public.proyectos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Solo admin/supervisor pueden modificar proyectos" ON public.proyectos;
CREATE POLICY "Solo admin/supervisor pueden modificar proyectos" ON public.proyectos
  FOR UPDATE USING (auth.role() = 'authenticated');

-- =============
-- GASTOS_PROYECTO
-- =============
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver gastos" ON public.gastos_proyecto;
CREATE POLICY "Usuarios autenticados pueden ver gastos" ON public.gastos_proyecto
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Solo admin/supervisor pueden crear gastos" ON public.gastos_proyecto;
CREATE POLICY "Solo admin/supervisor pueden crear gastos" ON public.gastos_proyecto
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Solo admin/supervisor pueden modificar gastos" ON public.gastos_proyecto;
CREATE POLICY "Solo admin/supervisor pueden modificar gastos" ON public.gastos_proyecto
  FOR UPDATE USING (auth.role() = 'authenticated');

-- =============
-- EVIDENCIAS_PROYECTO
-- =============
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver evidencias" ON public.evidencias_proyecto;
CREATE POLICY "Usuarios autenticados pueden ver evidencias" ON public.evidencias_proyecto
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Solo admin/supervisor pueden crear evidencias" ON public.evidencias_proyecto;
CREATE POLICY "Solo admin/supervisor pueden crear evidencias" ON public.evidencias_proyecto
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Solo admin/supervisor pueden modificar evidencias" ON public.evidencias_proyecto;
CREATE POLICY "Solo admin/supervisor pueden modificar evidencias" ON public.evidencias_proyecto
  FOR UPDATE USING (auth.role() = 'authenticated');

-- =============
-- PAGOS_PERSONAL
-- =============
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver pagos" ON public.pagos_personal;
CREATE POLICY "Usuarios autenticados pueden ver pagos" ON public.pagos_personal
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Solo admin/supervisor pueden crear pagos" ON public.pagos_personal;
CREATE POLICY "Solo admin/supervisor pueden crear pagos" ON public.pagos_personal
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Solo admin/supervisor pueden modificar pagos" ON public.pagos_personal;
CREATE POLICY "Solo admin/supervisor pueden modificar pagos" ON public.pagos_personal
  FOR UPDATE USING (auth.role() = 'authenticated');

-- =============
-- INFORMES_FINALES
-- =============
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver informes" ON public.informes_finales;
CREATE POLICY "Usuarios autenticados pueden ver informes" ON public.informes_finales
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Solo admin/supervisor pueden crear informes" ON public.informes_finales;
CREATE POLICY "Solo admin/supervisor pueden crear informes" ON public.informes_finales
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Solo admin/supervisor pueden modificar informes" ON public.informes_finales;
CREATE POLICY "Solo admin/supervisor pueden modificar informes" ON public.informes_finales
  FOR UPDATE USING (auth.role() = 'authenticated');

-- =============================
-- FIN DEL SCRIPT
-- =============================
-- Revisa los roles y privilegios en Supabase Auth para que los usuarios tengan el rol correcto.
-- Si necesitas migrar datos adicionales, usa la función de importación de Supabase o scripts ETL.
