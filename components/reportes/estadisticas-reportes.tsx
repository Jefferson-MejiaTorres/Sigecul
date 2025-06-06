"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  FolderOpen, 
  DollarSign, 
  CreditCard, 
  Camera, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import { supabase } from "@/lib/supabase"

interface EstadisticasData {
  totalProyectos: number
  proyectosActivos: number
  totalGastos: number
  totalPagos: number
  totalEvidencias: number
  gastosMesActual: number
  pagosMesActual: number
  proyectosSinActividad: number
}

export function EstadisticasReportes() {
  const [estadisticas, setEstadisticas] = useState<EstadisticasData>({
    totalProyectos: 0,
    proyectosActivos: 0,
    totalGastos: 0,
    totalPagos: 0,
    totalEvidencias: 0,
    gastosMesActual: 0,
    pagosMesActual: 0,
    proyectosSinActividad: 0
  })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarEstadisticas()
  }, [])

  const cargarEstadisticas = async () => {
    try {
      setCargando(true)
      
      // Obtener estadísticas de proyectos
      const { data: proyectos } = await supabase
        .from('proyectos')
        .select('id, estado')
      
      const totalProyectos = proyectos?.length || 0
      const proyectosActivos = proyectos?.filter(p => p.estado === 'activo').length || 0

      // Obtener estadísticas de gastos
      const { data: gastos } = await supabase
        .from('gastos')
        .select('monto, fecha_gasto')
      
      const totalGastos = gastos?.reduce((sum, g) => sum + g.monto, 0) || 0
      
      // Gastos del mes actual
      const inicioMes = new Date()
      inicioMes.setDate(1)
      inicioMes.setHours(0, 0, 0, 0)
      
      const gastosMesActual = gastos?.filter(g => 
        new Date(g.fecha_gasto) >= inicioMes
      ).reduce((sum, g) => sum + g.monto, 0) || 0

      // Obtener estadísticas de pagos
      const { data: pagos } = await supabase
        .from('pagos')
        .select('monto, fecha_pago')
      
      const totalPagos = pagos?.reduce((sum, p) => sum + p.monto, 0) || 0
      
      const pagosMesActual = pagos?.filter(p => 
        new Date(p.fecha_pago) >= inicioMes
      ).reduce((sum, p) => sum + p.monto, 0) || 0

      // Obtener estadísticas de evidencias
      const { data: evidencias } = await supabase
        .from('evidencias')
        .select('id')
      
      const totalEvidencias = evidencias?.length || 0

      // Proyectos sin actividad reciente (sin gastos o pagos en los últimos 30 días)
      const hace30Dias = new Date()
      hace30Dias.setDate(hace30Dias.getDate() - 30)
      
      const { data: proyectosConActividad } = await supabase
        .from('gastos')
        .select('proyecto_id')
        .gte('fecha_gasto', hace30Dias.toISOString())
      
      const { data: proyectosConPagos } = await supabase
        .from('pagos')
        .select('proyecto_id')
        .gte('fecha_pago', hace30Dias.toISOString())
      
      const proyectosActividadIds = new Set([
        ...(proyectosConActividad?.map(p => p.proyecto_id) || []),
        ...(proyectosConPagos?.map(p => p.proyecto_id) || [])
      ])
      
      const proyectosSinActividad = totalProyectos - proyectosActividadIds.size

      setEstadisticas({
        totalProyectos,
        proyectosActivos,
        totalGastos,
        totalPagos,
        totalEvidencias,
        gastosMesActual,
        pagosMesActual,
        proyectosSinActividad
      })
      
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    } finally {
      setCargando(false)
    }
  }

  const formatearMoneda = (cantidad: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(cantidad)
  }

  const calcularTendencia = (actual: number, total: number) => {
    if (total === 0) return 0
    return (actual / total) * 100
  }

  if (cargando) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Proyectos */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Proyectos Totales
          </CardTitle>
          <FolderOpen className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{estadisticas.totalProyectos}</div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              {estadisticas.proyectosActivos} activos
            </Badge>
            {estadisticas.proyectosSinActividad > 0 && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {estadisticas.proyectosSinActividad} inactivos
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gastos */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Gastos Totales
          </CardTitle>
          <DollarSign className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {formatearMoneda(estadisticas.totalGastos)}
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs">
            {estadisticas.gastosMesActual > 0 ? (
              <>
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">
                  {formatearMoneda(estadisticas.gastosMesActual)} este mes
                </span>
              </>
            ) : (
              <span className="text-gray-500">Sin gastos este mes</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagos */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Pagos Totales
          </CardTitle>
          <CreditCard className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {formatearMoneda(estadisticas.totalPagos)}
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs">
            {estadisticas.pagosMesActual > 0 ? (
              <>
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">
                  {formatearMoneda(estadisticas.pagosMesActual)} este mes
                </span>
              </>
            ) : (
              <span className="text-gray-500">Sin pagos este mes</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Evidencias */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Evidencias
          </CardTitle>
          <Camera className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{estadisticas.totalEvidencias}</div>
          <div className="flex items-center gap-1 mt-2 text-xs">
            <CheckCircle className="h-3 w-3 text-green-600" />
            <span className="text-green-600">Documentación activa</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
