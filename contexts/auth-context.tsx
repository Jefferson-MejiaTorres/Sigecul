"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Usuario } from "@/lib/types"
import type { Session, User } from "@supabase/supabase-js"

interface AuthContextType {
  user: Usuario | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any | null }>
  signOut: () => Promise<void>
  isAuthenticated: boolean
  session: Session | null
  supabaseUser: User | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Obtener perfil del usuario desde la tabla usuarios (con useCallback para evitar bucles)
  const fetchUserProfile = useCallback(async (authUserId: string) => {
    try {
      console.log('👤 Obteniendo perfil del usuario:', authUserId)
      
      const { data: userData, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("auth_user_id", authUserId)
        .eq("activo", true)
        .single()

      if (error) {
        console.error('❌ Error obteniendo perfil:', error)
        return
      }

      if (userData) {
        console.log('✅ Perfil obtenido:', userData.nombre, userData.rol)
        setUser(userData)
      } else {
        console.log('⚠️ No se encontró perfil del usuario en la tabla usuarios')
        setUser(null)
      }
    } catch (error) {
      console.error('❌ Error en fetchUserProfile:', error)
      setUser(null)
    }
  }, [supabase])

  useEffect(() => {
    let isMounted = true

    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        console.log('🔍 Verificando sesión inicial...')
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('❌ Error obteniendo sesión inicial:', error)
          if (isMounted) setLoading(false)
          return
        }
        if (initialSession && isMounted) {
          console.log('✅ Sesión encontrada:', initialSession.user?.email)
          setSession(initialSession)
          setSupabaseUser(initialSession.user)
          await fetchUserProfile(initialSession.user.id)
        } else if (isMounted) {
          console.log('📝 No hay sesión activa')
          setUser(null)
        }
        if (isMounted) setLoading(false)
      } catch (error) {
        console.error('❌ Error en getInitialSession:', error)
        if (isMounted) setLoading(false)
      }
    }

    getInitialSession()

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        console.log('🔄 Auth state changed:', event, session?.user?.email)
        setSession(session)
        setSupabaseUser(session?.user ?? null)
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    // Listener para refrescar sesión al volver a la pestaña
    const handleVisibility = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const { data: { session: refreshedSession }, error } = await supabase.auth.getSession()
          if (error || !refreshedSession) {
            // Si no hay sesión válida, forzar logout
            setUser(null)
            setSession(null)
            setSupabaseUser(null)
            if (isMounted) router.push('/login')
            return
          }
          setSession(refreshedSession)
          setSupabaseUser(refreshedSession.user)
          await fetchUserProfile(refreshedSession.user.id)
        } catch (err) {
          setUser(null)
          setSession(null)
          setSupabaseUser(null)
          if (isMounted) router.push('/login')
        } finally {
          setLoading(false)
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      isMounted = false
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, []) // <-- SOLO array vacío para evitar listeners duplicados y bucles

  // Función de login usando Supabase Auth real
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      console.log('🔐 Intentando login con:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('❌ Error en login:', error.message)
        return { error }
      }

      if (data.user) {
        console.log('✅ Login exitoso:', data.user.email)
        // El perfil se cargará automáticamente por el onAuthStateChange
        return { error: null }
      }

      return { error: { message: "Error inesperado en el login" } }
    } catch (error) {
      console.error('❌ Error inesperado en signIn:', error)
      return { error: { message: "Error inesperado al iniciar sesión" } }
    } finally {
      setLoading(false)
    }
  }

  // Función de logout
  const signOut = async () => {
    try {
      setLoading(true)
      console.log('🚪 Cerrando sesión...')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Error en logout:', error)
        return
      }
      
      // Limpiar estado local
      setUser(null)
      setSession(null)
      setSupabaseUser(null)
      
      console.log('✅ Sesión cerrada exitosamente')
      router.push("/login")
    } catch (error) {
      console.error('❌ Error inesperado en signOut:', error)
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!session && !!user,
    session,
    supabaseUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}
