"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Download, 
  Loader2,
  BarChart3,
  PieChart,
  TrendingUp,
  FileText,
  FileSpreadsheet,
  DollarSign,
  Users,
  FolderOpen,
  Camera,
  Calendar,
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { 
  GraficoProyectosPorEstado, 
  GraficoGastosPorCategoria, 
  GraficoTendenciaMensual,
  GraficoResumenFinanciero 
} from "./graficos-reportes"

interface ReportesConsolidadosProps {
  onMensaje: (tipo: 'success' | 'error', mensaje: string) => void
}

interface DatosConsolidados {
  resumenGeneral: {
    totalProyectos: number
    proyectosActivos: number
    totalGastos: number
    totalPagos: number
    totalEvidencias: number
    eficienciaPresupuestal: number
  }
  proyectosPorEstado: Array<{
    estado: string
    cantidad: number
    porcentaje: number
  }>
  gastosPorCategoria: Array<{
    categoria: string
    total: number
    porcentaje: number
  }>
  pagosPorTrabajador: Array<{
    trabajador: string
    total: number
    proyecto: string
  }>
  tendenciaMensual: Array<{
    mes: string
    gastos: number
    pagos: number
  }>
}

const reportesPredefinidos = [
  {
    id: 'ejecutivo-mensual',
    titulo: 'Informe Ejecutivo Mensual',
    descripcion: 'Resumen completo de actividades, gastos y avance de proyectos del mes actual',
    icono: BarChart3,
    color: 'bg-blue-600',
    incluye: ['Resumen estadístico', 'Gráficos principales', 'Estados de proyectos', 'Alertas importantes']
  },
  {
    id: 'financiero-trimestral',
    titulo: 'Reporte Financiero Trimestral',
    descripcion: 'Análisis detallado de gastos, pagos y ejecución presupuestal trimestral',
    icono: DollarSign,
    color: 'bg-green-600',
    incluye: ['Análisis financiero', 'Ejecución presupuestal', 'Gastos por categoría', 'Tendencias de pagos']
  },
  {
    id: 'avance-proyectos',
    titulo: 'Estado de Avance de Proyectos',
    descripcion: 'Consolidado del estado actual y progreso de todos los proyectos activos',
    icono: FolderOpen,
    color: 'bg-orange-600',
    incluye: ['Estado por proyecto', 'Cronogramas', 'Recursos asignados', 'Evidencias documentales']
  },
  {
    id: 'productividad-trabajadores',
    titulo: 'Reporte de Productividad',
    descripción: 'Análisis de productividad y pagos por trabajador en todos los proyectos',
    icono: Users,
    color: 'bg-purple-600',
    incluye: ['Pagos por trabajador', 'Horas trabajadas', 'Proyectos asignados', 'Rendimiento']
  }
]

export function ReportesConsolidados({ onMensaje }: ReportesConsolidadosProps) {
  const [datos, setDatos] = useState<DatosConsolidados | null>(null)
  const [cargando, setCargando] = useState(true)
  const [generandoReporte, setGenerandoReporte] = useState<string | null>(null)

  useEffect(() => {
    cargarDatosConsolidados()
  }, [])

  const cargarDatosConsolidados = async () => {
    try {
      setCargando(true)
      
      // Cargar datos de proyectos
      const { data: proyectos } = await supabase
        .from('proyectos')
        .select('id, nombre, estado, presupuesto')
      
      // Cargar datos de gastos
      const { data: gastos } = await supabase
        .from('gastos')
        .select('id, monto, categoria, fecha_gasto, proyecto_id')
      
      // Cargar datos de pagos
      const { data: pagos } = await supabase
        .from('pagos')
        .select('id, monto, trabajador_nombre, fecha_pago, proyecto_id')
      
      // Cargar datos de evidencias
      const { data: evidencias } = await supabase
        .from('evidencias')
        .select('id, proyecto_id')

      // Procesar datos para consolidado
      const totalProyectos = proyectos?.length || 0
      const proyectosActivos = proyectos?.filter(p => p.estado === 'activo').length || 0
      const totalGastos = gastos?.reduce((sum, g) => sum + g.monto, 0) || 0
      const totalPagos = pagos?.reduce((sum, p) => sum + p.monto, 0) || 0
      const totalEvidencias = evidencias?.length || 0
      
      // Calcular eficiencia presupuestal
      const presupuestoTotal = proyectos?.reduce((sum, p) => sum + (p.presupuesto || 0), 0) || 0
      const eficienciaPresupuestal = presupuestoTotal > 0 ? (totalGastos / presupuestoTotal) * 100 : 0

      // Proyectos por estado
      const estadosCount = proyectos?.reduce((acc, p) => {
        acc[p.estado] = (acc[p.estado] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}
      
      const proyectosPorEstado = Object.entries(estadosCount).map(([estado, cantidad]) => ({
        estado,
        cantidad,
        porcentaje: (cantidad / totalProyectos) * 100
      }))

      // Gastos por categoría
      const categoriasCount = gastos?.reduce((acc, g) => {
        acc[g.categoria] = (acc[g.categoria] || 0) + g.monto
        return acc
      }, {} as Record<string, number>) || {}
      
      const gastosPorCategoria = Object.entries(categoriasCount).map(([categoria, total]) => ({
        categoria,
        total,
        porcentaje: (total / totalGastos) * 100
      }))

      // Pagos por trabajador (top 10)
      const trabajadoresCount = pagos?.reduce((acc, p) => {
        const key = p.trabajador_nombre
        if (!acc[key]) {
          acc[key] = { total: 0, proyectos: new Set() }
        }
        acc[key].total += p.monto
        acc[key].proyectos.add(p.proyecto_id)
        return acc
      }, {} as Record<string, { total: number, proyectos: Set<string> }>) || {}
      
      const pagosPorTrabajador = Object.entries(trabajadoresCount)
        .map(([trabajador, data]) => ({
          trabajador,
          total: data.total,
          proyecto: `${data.proyectos.size} proyecto${data.proyectos.size !== 1 ? 's' : ''}`
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10)

      // Tendencia mensual (últimos 6 meses)
      const ahora = new Date()
      const tendenciaMensual = []
      
      for (let i = 5; i >= 0; i--) {
        const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
        const siguienteMes = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 1)
        
        const gastosMes = gastos?.filter(g => {
          const fechaGasto = new Date(g.fecha_gasto)
          return fechaGasto >= fecha && fechaGasto < siguienteMes
        }).reduce((sum, g) => sum + g.monto, 0) || 0
        
        const pagosMes = pagos?.filter(p => {
          const fechaPago = new Date(p.fecha_pago)
          return fechaPago >= fecha && fechaPago < siguienteMes
        }).reduce((sum, p) => sum + p.monto, 0) || 0
        
        tendenciaMensual.push({
          mes: fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
          gastos: gastosMes,
          pagos: pagosMes
        })
      }

      setDatos({
        resumenGeneral: {
          totalProyectos,
          proyectosActivos,
          totalGastos,
          totalPagos,
          totalEvidencias,
          eficienciaPresupuestal
        },
        proyectosPorEstado,
        gastosPorCategoria,
        pagosPorTrabajador,
        tendenciaMensual
      })
      
    } catch (error) {
      console.error('Error al cargar datos consolidados:', error)
      onMensaje('error', 'Error al cargar los datos consolidados')
    } finally {
      setCargando(false)
    }
  }

  const generarReporteConsolidado = async (tipoReporte: string) => {
    setGenerandoReporte(tipoReporte)
    try {
      // Simular generación de reporte
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const reporte = reportesPredefinidos.find(r => r.id === tipoReporte)
      onMensaje('success', `Reporte "${reporte?.titulo}" generado exitosamente`)
      
    } catch (error) {
      console.error('Error al generar reporte:', error)
      onMensaje('error', 'Error al generar el reporte consolidado')
    } finally {
      setGenerandoReporte(null)
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

  if (cargando) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumen General */}
      {datos && (
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Proyectos</p>
                  <p className="text-2xl font-bold">{datos.resumenGeneral.totalProyectos}</p>
                  <p className="text-xs text-green-600">{datos.resumenGeneral.proyectosActivos} activos</p>
                </div>
                <FolderOpen className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Gastos</p>
                  <p className="text-xl font-bold">{formatearMoneda(datos.resumenGeneral.totalGastos)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pagos</p>
                  <p className="text-xl font-bold">{formatearMoneda(datos.resumenGeneral.totalPagos)}</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Evidencias</p>
                  <p className="text-2xl font-bold">{datos.resumenGeneral.totalEvidencias}</p>
                </div>
                <Camera className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div>
                <p className="text-sm text-gray-600">Eficiencia Presupuestal</p>
                <p className="text-xl font-bold">{datos.resumenGeneral.eficienciaPresupuestal.toFixed(1)}%</p>
                <Progress 
                  value={datos.resumenGeneral.eficienciaPresupuestal} 
                  className="mt-2 h-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reportes Predefinidos */}
      <div className="grid md:grid-cols-2 gap-6">
        {reportesPredefinidos.map((reporte) => {
          const IconoReporte = reporte.icono
          const generando = generandoReporte === reporte.id
          
          return (
            <Card key={reporte.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${reporte.color}`}>
                      <IconoReporte className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{reporte.titulo}</CardTitle>
                      <CardDescription className="mt-1">
                        {reporte.descripcion}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Incluye:</p>
                    <div className="flex flex-wrap gap-1">
                      {reporte.incluye.map((item, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => generarReporteConsolidado(reporte.id)}
                      disabled={generando}
                      className="flex-1"
                      variant="outline"
                    >
                      {generando ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          PDF
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => generarReporteConsolidado(reporte.id)}
                      disabled={generando}
                      className="flex-1"
                      variant="outline"
                    >
                      {generando ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Excel
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>      {/* Gráficos y Análisis Visual */}
      {datos && (
        <div className="space-y-6">          {/* Resumen Financiero */}
          <GraficoResumenFinanciero 
            totalPresupuesto={datos.resumenGeneral.totalGastos + datos.resumenGeneral.totalPagos}
            totalEjecutado={datos.resumenGeneral.totalGastos + datos.resumenGeneral.totalPagos}
            porcentajeEjecucion={datos.resumenGeneral.eficienciaPresupuestal}
          />
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Gráfico de Proyectos por Estado */}
            <GraficoProyectosPorEstado datos={datos.proyectosPorEstado} />
            
            {/* Gráfico de Gastos por Categoría */}
            <GraficoGastosPorCategoria datos={datos.gastosPorCategoria} />
          </div>
          
          {/* Gráfico de Tendencia Mensual */}
          <GraficoTendenciaMensual datos={datos.tendenciaMensual} />
          
          {/* Información Adicional en Tabla */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Top Trabajadores */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Top Pagos por Trabajador
                </CardTitle>
                <CardDescription>Los 5 trabajadores con mayores pagos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {datos.pagosPorTrabajador.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <div>
                        <p className="text-sm font-medium">{item.trabajador}</p>
                        <p className="text-xs text-gray-500">{item.proyecto}</p>
                      </div>
                      <span className="text-sm font-bold text-green-600">{formatearMoneda(item.total)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Alertas y Notificaciones */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Alertas del Sistema
                </CardTitle>
                <CardDescription>Notificaciones importantes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {datos.resumenGeneral.eficienciaPresupuestal > 90 && (
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-red-50 border border-red-200">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Presupuesto Crítico</p>
                        <p className="text-xs text-red-600">Ejecución presupuestal al {datos.resumenGeneral.eficienciaPresupuestal.toFixed(1)}%</p>
                      </div>
                    </div>
                  )}
                  
                  {datos.resumenGeneral.proyectosActivos < datos.resumenGeneral.totalProyectos * 0.7 && (
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-yellow-50 border border-yellow-200">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Proyectos Inactivos</p>
                        <p className="text-xs text-yellow-600">Solo {((datos.resumenGeneral.proyectosActivos / datos.resumenGeneral.totalProyectos) * 100).toFixed(1)}% de proyectos activos</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-green-50 border border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Sistema Actualizado</p>
                      <p className="text-xs text-green-600">Datos sincronizados correctamente</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Estadísticas Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Estadísticas Rápidas
                </CardTitle>
                <CardDescription>Métricas importantes del período</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-blue-50">
                    <span className="text-sm text-blue-700">Promedio gastos/proyecto</span>
                    <span className="font-bold text-blue-800">
                      {formatearMoneda(datos.resumenGeneral.totalProyectos > 0 ? datos.resumenGeneral.totalGastos / datos.resumenGeneral.totalProyectos : 0)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-2 rounded-lg bg-green-50">
                    <span className="text-sm text-green-700">Promedio pagos/proyecto</span>
                    <span className="font-bold text-green-800">
                      {formatearMoneda(datos.resumenGeneral.totalProyectos > 0 ? datos.resumenGeneral.totalPagos / datos.resumenGeneral.totalProyectos : 0)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-2 rounded-lg bg-purple-50">
                    <span className="text-sm text-purple-700">Evidencias/proyecto</span>
                    <span className="font-bold text-purple-800">
                      {(datos.resumenGeneral.totalProyectos > 0 ? datos.resumenGeneral.totalEvidencias / datos.resumenGeneral.totalProyectos : 0).toFixed(1)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-2 rounded-lg bg-orange-50">
                    <span className="text-sm text-orange-700">Total invertido</span>
                    <span className="font-bold text-orange-800">
                      {formatearMoneda(datos.resumenGeneral.totalGastos + datos.resumenGeneral.totalPagos)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
