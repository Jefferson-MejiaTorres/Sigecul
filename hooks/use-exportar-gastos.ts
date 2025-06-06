// Hook personalizado para manejar la exportación de gastos con soporte para Excel, CSV y PDF
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { exportarGastosACSV, exportarGastosAExcel, exportarGastosAPDF, obtenerGastosParaExportacion } from "@/lib/export-gastos"

export function useExportarGastos() {
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
      
      await exportarGastosACSV(user.id)
      
    } catch (err: any) {
      const errorMessage = err.message || "Error al exportar los gastos"
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
      
      await exportarGastosAExcel(user.id)
      
    } catch (err: any) {
      const errorMessage = err.message || "Error al exportar los gastos a Excel"
      setError(errorMessage)
      console.error("Error al exportar a Excel:", err)
      throw err    } finally {
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
      
      await exportarGastosAPDF(user.id)
      
    } catch (err: any) {
      const errorMessage = err.message || "Error al exportar los gastos a PDF"
      setError(errorMessage)
      console.error("Error al exportar a PDF:", err)
      throw err
    } finally {
      setExportando(false)
    }
  }

  const verificarGastosDisponibles = async (): Promise<boolean> => {
    if (!user) return false

    try {
      const gastos = await obtenerGastosParaExportacion(user.id)
      return gastos.length > 0
    } catch (error) {
      console.error("Error al verificar gastos:", error)
      return false
    }
  }
  return {
    exportarCSV,
    exportarExcel,
    exportarPDF,
    verificarGastosDisponibles,
    exportando,
    error,
    limpiarError: () => setError(null)
  }
}
