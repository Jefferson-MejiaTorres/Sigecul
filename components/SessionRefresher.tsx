"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, RefreshCw } from "lucide-react"

export function SessionRefresher() {
  const { loading, user } = useAuth()
  const [showReload, setShowReload] = useState(false)
  const [reloading, setReloading] = useState(false)
  const [lastFetch, setLastFetch] = useState(0)

  useEffect(() => {
    const handleVisibility = () => {
      const now = Date.now()
      if (now - lastFetch < 1000) return
      setLastFetch(now)
      if (document.visibilityState === "visible") {
        // Si no hay usuario, forzar recarga inmediata
        if (!loading && !user) {
          window.location.href = "/login"
          return
        }
        setShowReload(false) // Reinicia para permitir animación
        setTimeout(() => setShowReload(true), 50)
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [lastFetch, loading, user])

  const handleReload = () => {
    setReloading(true)
    window.location.reload()
  }

  if (!showReload) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-8 flex flex-col items-center gap-4 animate-fade-in">
        <RefreshCw className="h-8 w-8 text-red-600 animate-spin-slow" />
        <span className="text-lg font-semibold text-gray-800">Recargando datos por seguridad</span>
        <button
          className="mt-2 px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition disabled:opacity-60"
          onClick={handleReload}
          disabled={reloading}
        >
          {reloading ? (
            <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Recargando...</span>
          ) : (
            "Recargar ahora"
          )}
        </button>
        <span className="text-xs text-gray-500">Por seguridad, tu sesión y datos se refrescan al volver a la pestaña.</span>
      </div>
    </div>
  )
}
