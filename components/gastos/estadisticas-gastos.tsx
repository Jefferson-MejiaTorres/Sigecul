"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Clock, CheckCircle, AlertTriangle, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { formatCOP } from "@/lib/format-cop"
import { useGastosUpdate } from "@/components/gastos/gastos-update-context"
import { useGastosFiltrados } from "@/components/gastos/gastos-filtrados-context"

interface EstadisticasData {
  totalGastos: number
  gastosMes: number
  gastosPendientes: number
  gastosAprobados: number
  promedioGasto: number
  gastosHoy: number
}

export function EstadisticasGastos() {
  const [stats, setStats] = useState<EstadisticasData>({
    totalGastos: 0,
    gastosMes: 0,
    gastosPendientes: 0,
    gastosAprobados: 0,
    promedioGasto: 0,
    gastosHoy: 0,
  })
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { lastUpdate } = useGastosUpdate()
  const { totalGastosFiltrados, cantidadGastosFiltrados } = useGastosFiltrados()

  useEffect(() => {
    if (user) {
      fetchEstadisticas()
    }
  }, [user, lastUpdate])

  const fetchEstadisticas = async () => {
    try {
      setLoading(true)

      // Obtener proyectos del supervisor
      const { data: proyectos } = await supabase.from("proyectos").select("*").eq("supervisor_id", user?.id)

      if (!proyectos || proyectos.length === 0) {
        setLoading(false)
        return
      }

      const proyectoIds = proyectos.map((p) => p.id)

      // Obtener todos los gastos
      const { data: gastos } = await supabase.from("gastos_proyecto").select("*").in("proyecto_id", proyectoIds)

      if (!gastos) {
        setLoading(false)
        return
      }

      // Calcular estadísticas generales
      const totalGastos = gastos.reduce((sum, gasto) => sum + Number(gasto.monto), 0)
      const gastosAprobados = gastos.filter((g) => g.aprobado).reduce((sum, gasto) => sum + Number(gasto.monto), 0)
      const gastosPendientes = gastos.filter((g) => !g.aprobado).reduce((sum, gasto) => sum + Number(gasto.monto), 0)

      // Gastos del mes actual
      const inicioMes = new Date()
      inicioMes.setDate(1)
      const gastosMes = gastos
        .filter((g) => new Date(g.fecha_gasto) >= inicioMes)
        .reduce((sum, gasto) => sum + Number(gasto.monto), 0)

      // Gastos de hoy
      const hoy = new Date().toISOString().split("T")[0]
      const gastosHoy = gastos.filter((g) => g.fecha_gasto === hoy).reduce((sum, gasto) => sum + Number(gasto.monto), 0)

      const promedioGasto = gastos.length > 0 ? totalGastos / gastos.length : 0

      setStats({
        totalGastos,
        gastosMes,
        gastosPendientes,
        gastosAprobados,
        promedioGasto,
        gastosHoy,
      })
    } catch (error) {
      console.error("Error al cargar estadísticas:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCOP(stats.totalGastos)}</div>
          <p className="text-xs text-muted-foreground">Todos los proyectos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{formatCOP(stats.gastosMes)}</div>
          <p className="text-xs text-muted-foreground">Gastos del mes actual</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{formatCOP(stats.gastosPendientes)}</div>
          <p className="text-xs text-muted-foreground">Por aprobar</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCOP(stats.gastosAprobados)}</div>
          <p className="text-xs text-muted-foreground">Confirmados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Promedio</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{formatCOP(Math.round(stats.promedioGasto))}</div>
          <p className="text-xs text-muted-foreground">Por gasto</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Filtrados</CardTitle>
          <Calendar className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{formatCOP(totalGastosFiltrados)}</div>
          <p className="text-xs text-muted-foreground">{cantidadGastosFiltrados} gastos mostrados</p>
        </CardContent>
      </Card>
    </div>
  )
}
