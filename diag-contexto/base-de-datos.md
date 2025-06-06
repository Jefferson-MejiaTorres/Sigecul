# Base de Datos - Análisis Detallado

## Resumen de la Base de Datos

SiGeCul utiliza **Supabase** como Backend-as-a-Service, que proporciona una base de datos **PostgreSQL** completamente gestionada con características avanzadas como Row Level Security (RLS), autenticación integrada, y APIs auto-generadas.

## Arquitectura de la Base de Datos

### Diagrama de Entidades
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   USUARIOS  │◄──►│  PROYECTOS  │◄──►│   GASTOS    │
│             │    │             │    │  _PROYECTO  │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   
       │                   ▼                   
       │           ┌─────────────┐    ┌─────────────┐
       │           │ EVIDENCIAS  │    │    PAGOS    │
       │           │ _PROYECTO   │    │  _PERSONAL  │
       │           └─────────────┘    └─────────────┘
       │                                     │
       │           ┌─────────────┐           │
       └──────────►│ INFORMES    │           │
                   │ _FINALES    │           │
                   └─────────────┘           │
                                            │
                            ┌─────────────┐ │
                            │TRABAJADORES │◄┘
                            └─────────────┘
```

## Estructura de Tablas

### 1. usuarios
Tabla principal para gestión de usuarios del sistema.

```sql
CREATE TABLE public.usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  nombre text NOT NULL,
  rol text NOT NULL CHECK (rol IN ('supervisor', 'admin', 'president')),
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  auth_user_id uuid UNIQUE -- Vinculación con Supabase Auth
);
```

**Características:**
- **Roles definidos:** supervisor, admin, president
- **Vinculación con Auth:** Campo `auth_user_id` conecta con Supabase Auth
- **Soft delete:** Campo `activo` para desactivar usuarios sin eliminar

### 2. proyectos
Tabla central del sistema, contiene todos los proyectos culturales.

```sql
CREATE TABLE public.proyectos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  presupuesto_total numeric NOT NULL CHECK (presupuesto_total >= 0),
  presupuesto_ejecutado numeric NOT NULL DEFAULT 0 CHECK (presupuesto_ejecutado >= 0),
  fecha_inicio date NOT NULL,
  fecha_fin date,
  estado text NOT NULL DEFAULT 'planificacion' CHECK (estado IN ('planificacion', 'activo', 'finalizado', 'cancelado')),
  supervisor_id uuid NOT NULL REFERENCES usuarios(id),
  ministerio_aprobacion boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Características:**
- **Estados del proyecto:** planificación → activo → finalizado/cancelado
- **Control presupuestario:** Seguimiento de presupuesto total vs ejecutado
- **Supervisión:** Cada proyecto tiene un supervisor asignado
- **Aprobación ministerial:** Flag para proyectos que requieren aprobación

### 3. gastos_proyecto
Registro de todos los gastos asociados a proyectos.

```sql
CREATE TABLE public.gastos_proyecto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id uuid NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  tipo_gasto text NOT NULL CHECK (tipo_gasto IN ('honorarios', 'refrigerios', 'transporte', 'materiales', 'servicios', 'otros')),
  monto numeric NOT NULL CHECK (monto > 0),
  fecha_gasto date NOT NULL,
  descripcion text NOT NULL,
  responsable text,
  aprobado boolean NOT NULL DEFAULT false,
  evidencia_url text,
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES usuarios(id)
);
```

**Características:**
- **Categorización:** 6 tipos de gastos predefinidos
- **Workflow de aprobación:** Campo `aprobado` para control de gastos
- **Evidencias:** URL para documentos de soporte
- **Auditoría:** Tracking de quién creó cada gasto

### 4. trabajadores
Maestro de trabajadores/colaboradores del proyecto.

```sql
CREATE TABLE public.trabajadores (
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
```

### 5. pagos_personal
Registro de pagos a trabajadores por actividades en proyectos.

```sql
CREATE TABLE public.pagos_personal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id uuid NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  trabajador_id uuid NOT NULL REFERENCES trabajadores(id),
  fecha_actividad date NOT NULL,
  tipo_labor text NOT NULL,
  horas_trabajadas numeric CHECK (horas_trabajadas IS NULL OR horas_trabajadas > 0),
  valor_pactado numeric NOT NULL CHECK (valor_pactado >= 0),
  estado_pago text NOT NULL DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'pagado', 'cancelado')),
  fecha_pago date,
  comprobante_url text,
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES usuarios(id)
);
```

### 6. evidencias_proyecto
Almacenamiento de evidencias documentales de actividades.

```sql
CREATE TABLE public.evidencias_proyecto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id uuid NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  fecha_actividad date NOT NULL,
  tipo_evidencia text NOT NULL CHECK (tipo_evidencia IN ('fotografia', 'lista_asistencia', 'informe', 'video', 'documento', 'otro')),
  nombre_archivo text NOT NULL,
  url_archivo text NOT NULL,
  tamaño_archivo integer CHECK (tamaño_archivo IS NULL OR tamaño_archivo > 0),
  descripcion text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES usuarios(id)
);
```

### 7. informes_finales
Informes de cierre y resumen de proyectos.

```sql
CREATE TABLE public.informes_finales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id uuid NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  contenido text NOT NULL,
  archivo_url text,
  total_gastos numeric CHECK (total_gastos IS NULL OR total_gastos >= 0),
  total_participantes integer CHECK (total_participantes IS NULL OR total_participantes >= 0),
  fecha_entrega date,
  observaciones_generales text,
  estado text NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'finalizado', 'entregado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES usuarios(id)
);
```

## Row Level Security (RLS)

### Concepto
RLS es una característica de PostgreSQL que permite filtrar automáticamente las filas que un usuario puede ver o modificar basándose en políticas de seguridad definidas.

### Implementación en SiGeCul

#### Políticas de Usuarios
```sql
-- Usuarios solo pueden ver su propia información o si son admin/president
CREATE POLICY "Usuarios pueden ver su propio usuario" ON usuarios
  FOR SELECT USING (auth.uid()::uuid = id OR rol IN ('admin', 'president'));

-- Solo admins pueden modificar usuarios
CREATE POLICY "Solo admin puede modificar usuarios" ON usuarios
  FOR UPDATE USING (rol = 'admin');
```

#### Políticas Generales
- **SELECT:** Usuarios autenticados pueden ver datos
- **INSERT/UPDATE:** Solo roles admin/supervisor pueden modificar
- **DELETE:** Implementado mediante soft delete (activo = false)

### Beneficios del RLS
1. **Seguridad automática:** Filtrado transparente en consultas
2. **Reducción de errores:** No depende de filtros en aplicación
3. **Performance:** Aplicado a nivel de base de datos
4. **Auditoría:** Control granular de accesos

## Sistema de Autenticación

### Integración Supabase Auth + Tabla Usuarios

```
┌─────────────────┐    ┌─────────────────┐
│  Supabase Auth  │    │ Tabla Usuarios  │
│                 │    │                 │
│ - JWT Tokens    │◄──►│ - Roles         │
│ - Sessions      │    │ - Perfiles      │
│ - Passwords     │    │ - Permisos      │
└─────────────────┘    └─────────────────┘
```

### Flujo de Autenticación

1. **Login:** Usuario ingresa email/password
2. **Supabase Auth:** Valida credenciales, genera JWT
3. **Búsqueda de perfil:** Se busca en tabla `usuarios` por `auth_user_id`
4. **Contexto:** Se carga información del usuario en `AuthContext`
5. **RLS:** Políticas se aplican automáticamente con `auth.uid()`

### Usuarios Demo
El sistema incluye usuarios de prueba:
```sql
INSERT INTO usuarios (email, nombre, rol) VALUES
  ('supervisor@ccc.com', 'Jefferson Supervisor', 'supervisor'),
  ('admin@ccc.com', 'Luisa Administradora', 'admin'),
  ('presidente@ccc.com', 'Manuel Presidente', 'president');
```

## Conexión desde la Aplicación

### Cliente de Supabase
```typescript
// lib/supabase.ts
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}
```

### Operaciones Típicas

#### Consulta con Join
```typescript
const { data: gastos } = await supabase
  .from('gastos_proyecto')
  .select(`
    *,
    proyecto:proyectos(nombre, presupuesto_total),
    created_by:usuarios(nombre)
  `)
  .eq('proyecto_id', proyectoId)
```

#### Inserción con validación
```typescript
const { data, error } = await supabase
  .from('gastos_proyecto')
  .insert({
    proyecto_id,
    tipo_gasto,
    monto,
    descripcion,
    created_by: user.id
  })
  .select()
```

## Gestión de Archivos

### Supabase Storage
- **Buckets:** Contenedores para diferentes tipos de archivos
- **Policies:** Control de acceso a archivos
- **URLs públicas:** Para evidencias y documentos

### Implementación
```typescript
// Subir archivo
const { data, error } = await supabase.storage
  .from('evidencias')
  .upload(`${proyecto_id}/${filename}`, file)

// URL pública
const { data } = supabase.storage
  .from('evidencias')
  .getPublicUrl(path)
```

## Optimizaciones y Índices

### Índices Recomendados
```sql
-- Índices para consultas frecuentes
CREATE INDEX idx_gastos_proyecto_id ON gastos_proyecto(proyecto_id);
CREATE INDEX idx_pagos_trabajador_id ON pagos_personal(trabajador_id);
CREATE INDEX idx_evidencias_proyecto_id ON evidencias_proyecto(proyecto_id);
CREATE INDEX idx_usuarios_auth_id ON usuarios(auth_user_id);
```

### Consultas Optimizadas
- Uso de `select()` específico en lugar de `*`
- Filtros en base de datos antes de traer a cliente
- Paginación para listas grandes
- Joins eficientes con relaciones definidas

## Respaldo y Recuperación

### Automated Backups (Supabase)
- **Backups diarios:** Automáticos en plan Pro
- **Point-in-time recovery:** Hasta 7 días
- **Export/Import:** Via SQL dump o CSV

### Estrategia de Respaldo
1. **Datos críticos:** Proyectos, usuarios, gastos
2. **Archivos:** Evidencias en Supabase Storage
3. **Configuración:** Variables de entorno y políticas RLS

## Problemas Identificados

### 1. Multiple GoTrueClient Instances
```typescript
// Problema: Múltiples instancias de cliente
// Solución: Singleton pattern o Context único
```

### 2. Políticas RLS Genéricas
```sql
-- Actual: Muy permisivo
FOR SELECT USING (auth.role() = 'authenticated')

-- Recomendado: Más específico
FOR SELECT USING (
  auth.role() = 'authenticated' AND 
  proyecto_id IN (
    SELECT id FROM proyectos 
    WHERE supervisor_id = auth.uid()
  )
)
```

### 3. Falta de Triggers
Recomendado agregar:
- Update automático de `updated_at`
- Validaciones complejas
- Cálculos automáticos (presupuesto_ejecutado)

## Recomendaciones

1. **Implementar triggers:** Para actualizaciones automáticas
2. **Refinar RLS:** Políticas más granulares por rol
3. **Añadir índices:** Para consultas frecuentes
4. **Monitoring:** Logs de consultas lentas
5. **Cache:** Implementar cache para datos frecuentes
6. **Validaciones:** Más validaciones a nivel de BD
