// Hook personalizado para manejar la exportación de pagos con soporte para Excel, CSV y PDF
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { exportarPagosACSV, exportarPagosAExcel, exportarPagosAPDF, obtenerPagosParaExportacion } from "@/lib/export-pagos"

export function useExportarPagos() {
  const { user } = useAuth()
  const [exportando, setExportando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportarCSV = async () => {
    if (!user) {
      setError("Usuario no autenticado")
      return
    }

    try {
      setExportando(true)
      setError(null)
      
      await exportarPagosACSV(user.id)
      
    } catch (err: any) {
      const errorMessage = err.message || "Error al exportar los pagos"
      setError(errorMessage)
      console.error("Error al exportar:", err)
      throw err
    } finally {
      setExportando(false)
    }
  }

  const exportarExcel = async () => {
    if (!user) {
      setError("Usuario no autenticado")
      return
    }

    try {
      setExportando(true)
      setError(null)
      
      await exportarPagosAExcel(user.id)
      
    } catch (err: any) {
      const errorMessage = err.message || "Error al exportar los pagos a Excel"
      setError(errorMessage)
      console.error("Error al exportar a Excel:", err)
      throw err
    } finally {
      setExportando(false)
    }
  }

  const exportarPDF = async () => {
    if (!user) {
      setError("Usuario no autenticado")
      return
    }

    try {
      setExportando(true)
      setError(null)
      
      await exportarPagosAPDF(user.id)
      
    } catch (err: any) {
      const errorMessage = err.message || "Error al exportar los pagos a PDF"
      setError(errorMessage)
      console.error("Error al exportar a PDF:", err)
      throw err
    } finally {
      setExportando(false)
    }
  }

  const verificarPagosDisponibles = async (): Promise<boolean> => {
    if (!user) return false

    try {
      const pagos = await obtenerPagosParaExportacion(user.id)
      return pagos.length > 0
    } catch (error) {
      console.error("Error al verificar pagos:", error)
      return false
    }
  }

  return {
    exportarCSV,
    exportarExcel,
    exportarPDF,
    verificarPagosDisponibles,
    exportando,
    error,
    limpiarError: () => setError(null)
  }
}
