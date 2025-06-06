"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Download, 
  FileText, 
  FileSpreadsheet,
  Calendar,
  Search,
  Filter,
  Trash2,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Loader2
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useHistorialReportes } from "@/hooks/use-historial-reportes"
import { HistorialReporte } from "@/lib/types"

interface HistorialReportesProps {
  onMensaje?: (tipo: 'success' | 'error', mensaje: string) => void
}

export function HistorialReportes({ onMensaje }: HistorialReportesProps) {
  const {
    reportes,
    cargando,
    error,
    incrementarDescargas,
    eliminarReporte,
    filtrarReportes,
    ordenarReportes
  } = useHistorialReportes()

  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [ordenarPor, setOrdenarPor] = useState<string>('fecha_desc')
  const [regenerando, setRegenerando] = useState<string | null>(null)

  const tiposReporte = [
    { value: 'todos', label: 'Todos los tipos' },
    { value: 'ejecutivo', label: 'Ejecutivo' },
    { value: 'financiero', label: 'Financiero' },
    { value: 'proyectos', label: 'Proyectos' },
    { value: 'personalizado', label: 'Personalizado' }
  ]

  const estadosReporte = [
    { value: 'todos', label: 'Todos los estados' },
    { value: 'completado', label: 'Completado' },
    { value: 'procesando', label: 'Procesando' },
    { value: 'error', label: 'Error' }
  ]

  const opcionesOrden = [
    { value: 'fecha_desc', label: 'Más recientes' },
    { value: 'fecha_asc', label: 'Más antiguos' },
    { value: 'nombre_asc', label: 'Nombre A-Z' },
    { value: 'descargas_desc', label: 'Más descargados' },
    { value: 'tamaño_desc', label: 'Mayor tamaño' }
  ]

  // Aplicar filtros y ordenamiento
  const reportesFiltrados = ordenarReportes(
    filtrarReportes(reportes, filtroTexto, filtroTipo, filtroEstado),
    ordenarPor
  )

  const formatearTamaño = (tamañoMB: number): string => {
    if (tamañoMB === 0) return '-'
    if (tamañoMB < 1) return `${(tamañoMB * 1024).toFixed(0)} KB`
    return `${tamañoMB.toFixed(1)} MB`
  }

  const getBadgeColor = (tipo: HistorialReporte['tipo']) => {
    switch (tipo) {
      case 'ejecutivo':
        return 'bg-blue-100 text-blue-800'
      case 'financiero':
        return 'bg-green-100 text-green-800'
      case 'proyectos':
        return 'bg-orange-100 text-orange-800'
      case 'personalizado':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getEstadoBadge = (estado: HistorialReporte['estado']) => {
    switch (estado) {
      case 'completado':
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>
      case 'procesando':
        return <Badge className="bg-yellow-100 text-yellow-800">Procesando</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      default:
        return <Badge>Desconocido</Badge>
    }
  }

  const descargarReporte = async (reporte: HistorialReporte) => {
    try {
      if (reporte.url_archivo) {
        // Crear enlace de descarga
        const link = document.createElement('a')
        link.href = reporte.url_archivo
        link.download = `${reporte.nombre}.${reporte.formato === 'ambos' ? 'pdf' : reporte.formato}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Incrementar contador de descargas
        await incrementarDescargas(reporte.id)
        
        onMensaje?.('success', `Reporte "${reporte.nombre}" descargado exitosamente`)
      } else {
        onMensaje?.('error', 'El archivo del reporte no está disponible')
      }
    } catch (err) {
      console.error('Error al descargar reporte:', err)
      onMensaje?.('error', 'Error al descargar el reporte')
    }
  }

  const manejarEliminarReporte = async (reporteId: string, nombreReporte: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este reporte?')) {
      const exito = await eliminarReporte(reporteId)
      if (exito) {
        onMensaje?.('success', `Reporte "${nombreReporte}" eliminado exitosamente`)
      } else {
        onMensaje?.('error', 'Error al eliminar el reporte')
      }
    }
  }

  const regenerarReporte = async (reporte: HistorialReporte) => {
    try {
      setRegenerando(reporte.id)
      // Aquí iría la lógica para regenerar el reporte
      // Por ahora solo simulamos el proceso
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      onMensaje?.('success', `Reporte "${reporte.nombre}" regenerado exitosamente`)
    } catch (err) {
      console.error('Error al regenerar reporte:', err)
      onMensaje?.('error', 'Error al regenerar el reporte')
    } finally {
      setRegenerando(null)
    }
  }

  if (cargando) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Cargando historial de reportes...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-red-600">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Error al cargar reportes</p>
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controles de Filtro y Búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historial de Reportes
          </CardTitle>
          <CardDescription>
            Consulta y gestiona todos los reportes generados anteriormente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, descripción o creador..."
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposReporte.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {estadosReporte.map(estado => (
                    <SelectItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={ordenarPor} onValueChange={setOrdenarPor}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {opcionesOrden.map(opcion => (
                    <SelectItem key={opcion.value} value={opcion.value}>
                      {opcion.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas Rápidas */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{reportes.length}</p>
              <p className="text-sm text-gray-600">Total de reportes</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {reportes.filter(r => r.estado === 'completado').length}
              </p>
              <p className="text-sm text-gray-600">Completados</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {reportes.filter(r => r.estado === 'procesando').length}
              </p>
              <p className="text-sm text-gray-600">En proceso</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {reportes.reduce((sum, r) => sum + r.descargas, 0)}
              </p>
              <p className="text-sm text-gray-600">Total descargas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Reportes */}
      <Card>
        <CardHeader>
          <CardTitle>Reportes Generados</CardTitle>
          <CardDescription>
            {reportesFiltrados.length} de {reportes.length} reportes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reporte</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead>Tamaño</TableHead>
                  <TableHead>Descargas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportesFiltrados.map((reporte) => (
                  <TableRow key={reporte.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{reporte.nombre}</p>
                        {reporte.descripcion && (
                          <p className="text-sm text-gray-500">{reporte.descripcion}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">por {reporte.creado_por}</span>
                          <div className="flex gap-1">
                            {reporte.modulos.map(modulo => (
                              <Badge key={modulo} variant="outline" className="text-xs">
                                {modulo}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={getBadgeColor(reporte.tipo)}>
                        {reporte.tipo}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      {getEstadoBadge(reporte.estado)}
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {format(new Date(reporte.fecha_creacion), 'dd/MM/yyyy', { locale: es })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(reporte.fecha_creacion), 'HH:mm', { locale: es })}
                        </p>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-sm">{formatearTamaño(reporte.tamaño_mb)}</span>
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-sm">{reporte.descargas}</span>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {reporte.estado === 'completado' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => descargarReporte(reporte)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => regenerarReporte(reporte)}
                              disabled={regenerando === reporte.id}
                            >
                              {regenerando === reporte.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                              )}
                              Regenerar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => manejarEliminarReporte(reporte.id, reporte.nombre)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {reportesFiltrados.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {reportes.length === 0 
                  ? 'No hay reportes generados aún' 
                  : 'No se encontraron reportes con los filtros aplicados'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
