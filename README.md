# SiGeCul - Sistema de Gestión Cultural

Sistema web moderno para la gestión de proyectos y gastos culturales, desarrollado con Next.js 15 y Supabase.

## 🚀 Características principales

- **Autenticación Segura**: Sistema de login con Supabase Auth y roles (President, Admin, Supervisor)
- **Gestión de Proyectos**: CRUD completo, estados, presupuesto, evidencias y estadísticas
- **Control de Gastos**: Registro, edición, aprobación y seguimiento de gastos por proyecto
- **Gestión de Evidencias**: Subida y organización de documentos y facturas (soporte para archivos, preparado para integración con Supabase Storage)
- **Dashboard Optimizado**: Panel de control con métricas en tiempo real, refresco automático y manual
- **Accesibilidad y Usabilidad**: Formularios accesibles, campos monetarios amigables, navegación clara
- **Formato Monetario Consistente**: Todos los valores monetarios se muestran en pesos colombianos (COP) en toda la app
- **Navegación Mejorada**: Botones de volver y navegación siempre llevan al contexto correcto (gastos, proyectos, etc.)
- **Filtros y Estadísticas**: Filtros avanzados y estadísticas de gastos por estado, tipo, fecha y proyecto

## 🛠️ Tecnologías

- **Frontend**: Next.js 15, React 18, TypeScript
- **UI**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth + Database + Storage)
- **Base de Datos**: PostgreSQL

## 📋 Requisitos

- Node.js 18+
- Cuenta de Supabase
- Git

## ⚡ Instalación Rápida

1. **Clonar el repositorio**
```bash
git clone [URL_DEL_REPO]
cd BosetoCCC
```
2. **Instalar dependencias**
```bash
npm install
```
3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```
Editar `.env.local` con tus credenciales de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_publica_de_supabase
```
4. **Iniciar el servidor de desarrollo**
```bash
npm run dev
```
5. **Acceder a la aplicación**
```
http://localhost:3000
```

## 👥 Usuarios de Prueba

| Email                    | Contraseña | Rol        |
|-------------------------|------------|------------|
| presidente@sigecul.com  | 123456     | President  |
| admin@sigecul.com       | 123456     | Admin      |
| supervisor@sigecul.com  | 123456     | Supervisor |

## 📁 Estructura del Proyecto

```
├── app/                    # Páginas de Next.js 15
│   ├── dashboard/         # Panel principal (proyectos, gastos, evidencias)
│   ├── login/             # Página de autenticación
│   └── api/               # API routes
├── components/            # Componentes de UI y lógica
├── contexts/              # Context providers (auth, etc)
├── hooks/                 # Custom hooks
├── lib/                   # Utilidades, lógica de negocio y configuración
├── styles/                # Estilos globales
└── informacion/           # Scripts y ejemplos de políticas de seguridad
```

## 🔧 Comandos Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Construcción para producción
npm run start        # Servidor de producción
npm run lint         # Linter
npm run type-check   # Verificación de tipos
```

## 🧩 Cambios y Mejoras Recientes

- Refresco automático y manual de dashboard y listas
- Formato COP amigable y consistente en toda la UI (proyectos, gastos, estadísticas, formularios)
- Mejora de accesibilidad y usabilidad en formularios (inputs numéricos, ejemplos, selección, aria-labels)
- Botones de navegación y volver siempre llevan al contexto correcto (gastos, proyectos, etc.)
- Preparación para subida de archivos de evidencia (lógica referencial lista en `lib/upload-evidencia.ts`)
- Lógica de actualización automática tras cambios en gastos/proyectos
- Eliminación de botones duplicados y UI más limpia
- Código modular y reutilizable para formateo de moneda y subida de archivos

## 🔐 Seguridad

- Autenticación mediante Supabase Auth
- Row Level Security (RLS) en base de datos
- Validación de permisos por rol
- Middleware de protección de rutas

## 📊 Estado del Proyecto

✅ **Completado y Funcional**
- Sistema de autenticación
- Dashboard optimizado
- Gestión de usuarios, proyectos y gastos
- Base de datos y seguridad configuradas
- UI/UX moderna, responsiva y accesible

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
