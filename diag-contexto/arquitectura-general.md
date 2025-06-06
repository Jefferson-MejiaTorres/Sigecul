# Arquitectura General - SiGeCul

## Resumen de la Arquitectura

SiGeCul es una aplicación web moderna construida con Next.js 14 que utiliza el App Router, desplegada en Vercel y conectada a Supabase como backend-as-a-service.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   FRONTEND      │    │    VERCEL       │    │   SUPABASE      │
│   (Next.js 14)  │◄──►│   (Hosting)     │◄──►│   (Backend)     │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Stack Tecnológico

### Frontend
- **Framework:** Next.js 14 con App Router
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **Componentes UI:** Radix UI + shadcn/ui
- **Gestión de Estado:** React Context API
- **Validación:** Zod
- **Iconos:** Lucide React

### Backend
- **Servicio:** Supabase (Backend-as-a-Service)
- **Base de Datos:** PostgreSQL (gestionada por Supabase)
- **Autenticación:** Supabase Auth
- **Almacenamiento:** Supabase Storage
- **APIs:** Auto-generadas por Supabase (REST y GraphQL)

### Despliegue
- **Hosting:** Vercel
- **CI/CD:** GitHub Actions (automático con Vercel)
- **Dominio:** Configurado en Vercel
- **Variables de Entorno:** Gestionadas en Vercel Dashboard

## Arquitectura del Frontend

### Estructura de Carpetas
```
app/                    # App Router de Next.js 14
├── dashboard/          # Páginas del dashboard principal
│   ├── gastos/        # Módulo de gestión de gastos
│   ├── pagos/         # Módulo de gestión de pagos
│   ├── proyectos/     # Módulo de gestión de proyectos
│   ├── evidencias/    # Módulo de gestión de evidencias
│   └── reportes/      # Módulo de reportes
├── login/             # Página de autenticación
└── globals.css        # Estilos globales

components/            # Componentes reutilizables
├── ui/               # Componentes base de shadcn/ui
├── gastos/           # Componentes específicos de gastos
├── pagos/            # Componentes específicos de pagos
├── proyectos/        # Componentes específicos de proyectos
├── evidencias/       # Componentes específicos de evidencias
└── reportes/         # Componentes específicos de reportes

contexts/             # Contextos de React
└── auth-context.tsx  # Gestión de autenticación

hooks/                # Custom hooks
├── use-auth.ts       # Hook de autenticación
├── use-exportar-*.ts # Hooks de exportación
└── use-*.ts         # Otros hooks específicos

lib/                  # Librerías y utilidades
├── supabase.ts      # Cliente de Supabase
├── types.ts         # Definiciones de tipos
├── utils.ts         # Utilidades generales
└── export-*.ts      # Funciones de exportación
```

### Flujo de Datos

1. **Autenticación:** Usuario se autentica via Supabase Auth
2. **Context API:** `AuthContext` maneja el estado de autenticación global
3. **Componentes:** Consumen datos via hooks personalizados
4. **Supabase Client:** Realiza operaciones CRUD en la base de datos
5. **Estado Local:** React `useState` para estado específico de componentes

### Patrones de Arquitectura

#### 1. Componentes por Módulo
Cada módulo funcional (gastos, pagos, proyectos, etc.) tiene su propia carpeta con:
- Componentes específicos
- Hooks personalizados
- Tipos de datos
- Funciones de utilidad

#### 2. Context API para Estado Global
- `AuthContext`: Maneja autenticación y usuario actual
- Contextos específicos para actualizaciones (ej: `EvidenciasUpdateContext`)

#### 3. Custom Hooks
- Encapsulan lógica de negocio
- Manejan llamadas a APIs
- Proporcionan estado y funciones a componentes

#### 4. Separación de Responsabilidades
- `/components`: Presentación y UI
- `/hooks`: Lógica de negocio
- `/lib`: Utilidades y configuración
- `/contexts`: Estado global

## Comunicación con el Backend

### Cliente de Supabase
```typescript
// lib/supabase.ts
export const supabase = createSupabaseClient()
```

### Operaciones Típicas
```typescript
// Crear registro
const { data, error } = await supabase
  .from('tabla')
  .insert(datos)

// Leer registros
const { data, error } = await supabase
  .from('tabla')
  .select('*')
  .eq('campo', 'valor')

// Actualizar registro
const { data, error } = await supabase
  .from('tabla')
  .update(cambios)
  .eq('id', id)

// Eliminar registro
const { data, error } = await supabase
  .from('tabla')
  .delete()
  .eq('id', id)
```

## Seguridad

### Row Level Security (RLS)
- Habilitado en todas las tablas de Supabase
- Políticas definidas para diferentes roles de usuario
- Filtrado automático basado en permisos

### Autenticación
- JWT tokens gestionados por Supabase Auth
- Renovación automática de tokens
- Persistencia de sesión en localStorage

### Autorización
- Roles definidos: `supervisor`, `admin`, `president`
- Permisos a nivel de base de datos via RLS policies
- Validación en frontend y backend

## Ventajas de esta Arquitectura

1. **Desarrollo Rápido:** Supabase proporciona backend completo
2. **Escalabilidad:** Vercel y Supabase escalan automáticamente
3. **Mantenibilidad:** Separación clara de responsabilidades
4. **Seguridad:** RLS y autenticación robusta
5. **Desarrollo Local:** Easy local development con Supabase CLI

## Desafíos Identificados

1. **Múltiples Clientes Supabase:** Warnings sobre instancias duplicadas
2. **Gestión de Estado:** Podría beneficiarse de un estado más centralizado
3. **Optimización:** Algunas consultas podrían optimizarse
4. **Testing:** Falta de tests unitarios y de integración
