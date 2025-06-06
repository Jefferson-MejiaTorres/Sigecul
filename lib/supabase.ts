import { createClient } from "@supabase/supabase-js"
import type {
  Usuario,
  Proyecto,
  GastoProyecto,
  PagoPersonal,
  Trabajador,
  EvidenciaProyecto,
  InformeFinal,
} from "./types"

// Tipos para nuestra base de datos
export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: Usuario
        Insert: Omit<Usuario, "id" | "created_at" | "updated_at"> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Usuario, "id" | "created_at" | "updated_at">>
      }
      proyectos: {
        Row: Proyecto
        Insert: Omit<Proyecto, "id" | "created_at" | "updated_at"> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Proyecto, "id" | "created_at" | "updated_at">>
      }
      gastos_proyecto: {
        Row: GastoProyecto
        Insert: Omit<GastoProyecto, "id" | "created_at"> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<GastoProyecto, "id" | "created_at">>
      }
      pagos_personal: {
        Row: PagoPersonal
        Insert: Omit<PagoPersonal, "id" | "created_at"> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<PagoPersonal, "id" | "created_at">>
      }
      trabajadores: {
        Row: Trabajador
        Insert: Omit<Trabajador, "id" | "created_at"> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<Trabajador, "id" | "created_at">>
      }
      evidencias_proyecto: {
        Row: EvidenciaProyecto
        Insert: Omit<EvidenciaProyecto, "id" | "created_at"> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<EvidenciaProyecto, "id" | "created_at">>
      }
      informes_finales: {
        Row: InformeFinal
        Insert: Omit<InformeFinal, "id" | "created_at"> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<InformeFinal, "id" | "created_at">>
      }
    }
  }
}

// Función para crear cliente de Supabase
export const createSupabaseClient = () => {
  // Siempre usar variables de entorno remotas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Las variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY son requeridas'
    )
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

// Cliente para el lado del servidor
export const createServerSupabaseClient = () => {
  // Siempre usar variables de entorno remotas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Las variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas'
    )
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Exportar la instancia principal
export const supabase = createSupabaseClient()

// ADVERTENCIA: Solo debe haber un cliente de Supabase por contexto/app
// Si ves el warning "Multiple GoTrueClient instances detected", revisa que NO estés llamando createSupabaseClient() dentro de componentes o hooks varias veces.
// Solución recomendada: Usa un singleton o contexto para el cliente de Supabase.
