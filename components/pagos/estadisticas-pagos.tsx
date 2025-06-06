"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Clock, CheckCircle, Users, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { formatCOP } from "@/lib/format-cop"
import { usePagosUpdate } from "@/components/pagos/pagos-update-context"

interface EstadisticasData {
  totalPagos: number
  pagosMes: number
  pagosPendientes: number
  pagosPagados: number
  promediopago: number
  pagosHoy: number
  totalTrabajadores: number
  trabajadoresActivos: number
}

function EstadisticasPagos() {
  const { user } = useAuth()
  const { lastUpdate } = usePagosUpdate()
  const [stats, setStats] = useState<EstadisticasData>({
    totalPagos: 0,
    pagosMes: 0,
    pagosPendientes: 0,
    pagosPagados: 0,
    promediopago: 0,
    pagosHoy: 0,
    totalTrabajadores: 0,
    trabajadoresActivos: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchEstadisticas()
    }
  }, [user, lastUpdate])

  const fetchEstadisticas = async () => {
    try {
      setLoading(true)

      // Obtener proyectos del usuario
      let query = supabase.from("proyectos").select("id")
      if (user?.rol === "supervisor") {
        query = query.eq("supervisor_id", user.id)
      }
      const { data: proyectos } = await query

      if (!proyectos || proyectos.length === 0) {
        setStats({
          totalPagos: 0,
          pagosMes: 0,
          pagosPendientes: 0,
          pagosPagados: 0,
          promediopago: 0,
          pagosHoy: 0,
          totalTrabajadores: 0,
          trabajadoresActivos: 0,
        })
        setLoading(false)
        return
      }

      const proyectoIds = proyectos.map(p => p.id)

      // Obtener todos los pagos de estos proyectos
      const { data: pagos } = await supabase
        .from("pagos_personal")
        .select(`
          *,
          trabajadores(nombre, especialidad),
          proyectos(nombre)
        `)
        .in("proyecto_id", proyectoIds)

      if (!pagos) {
        setLoading(false)
        return
      }

      // Calcular estadísticas
      const totalPagos = pagos.reduce((sum, p) => sum + Number(p.valor_pactado), 0)
      const cantidadPagos = pagos.length

      // Pagos del mes actual
      const inicioMes = new Date()
      inicioMes.setDate(1)
      const finMes = new Date()
      finMes.setMonth(finMes.getMonth() + 1)
      finMes.setDate(0)

      const pagosMes = pagos
        .filter(p => {
          const fecha = new Date(p.fecha_actividad)
          return fecha >= inicioMes && fecha <= finMes
        })
        .reduce((sum, p) => sum + Number(p.valor_pactado), 0)

      // Pagos por estado
      const pagosPendientes = pagos
        .filter(p => p.estado_pago === "pendiente")
        .reduce((sum, p) => sum + Number(p.valor_pactado), 0)

      const pagosPagados = pagos
        .filter(p => p.estado_pago === "pagado")
        .reduce((sum, p) => sum + Number(p.valor_pactado), 0)

      // Pagos de hoy
      const hoy = new Date().toISOString().split('T')[0]
      const pagosHoy = pagos
        .filter(p => p.fecha_actividad === hoy)
        .reduce((sum, p) => sum + Number(p.valor_pactado), 0)

      // Estadísticas de trabajadores
      const { data: trabajadores } = await supabase
        .from("trabajadores")
        .select("id, activo")

      const totalTrabajadores = trabajadores?.length || 0
      const trabajadoresActivos = trabajadores?.filter(t => t.activo !== false).length || 0

      setStats({
        totalPagos,
        pagosMes,
        pagosPendientes,
        pagosPagados,
        promediopago: cantidadPagos > 0 ? totalPagos / cantidadPagos : 0,
        pagosHoy,
        totalTrabajadores,
        trabajadoresActivos,
      })
    } catch (error) {
      console.error("Error al cargar estadísticas:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
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
          <CardTitle className="text-sm font-medium">Total Pagos</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCOP(stats.totalPagos)}</div>
          <p className="text-xs text-muted-foreground">Todos los proyectos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{formatCOP(stats.pagosMes)}</div>
          <p className="text-xs text-muted-foreground">Pagos del mes actual</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{formatCOP(stats.pagosPendientes)}</div>
          <p className="text-xs text-muted-foreground">Por pagar</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pagados</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCOP(stats.pagosPagados)}</div>
          <p className="text-xs text-muted-foreground">Completados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Promedio</CardTitle>
          <TrendingUp className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{formatCOP(Math.round(stats.promediopago))}</div>
          <p className="text-xs text-muted-foreground">Por pago</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Trabajadores</CardTitle>
          <Users className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{stats.trabajadoresActivos}</div>
          <p className="text-xs text-muted-foreground">{stats.totalTrabajadores} registrados</p>
        </CardContent>      </Card>
    </div>
  )
}

export { EstadisticasPagos }
export default EstadisticasPagos
