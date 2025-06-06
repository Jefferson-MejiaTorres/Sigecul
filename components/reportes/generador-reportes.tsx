"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { 
  FileText, 
  FileSpreadsheet, 
  Download, 
  Loader2,
  Settings,
  BarChart3,
  PieChart,
  TrendingUp,
  Eye,
  Save
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useGenerarReportes } from "@/hooks/use-generar-reportes"

interface GeneradorReportesProps {
  onMensaje: (tipo: 'success' | 'error', mensaje: string) => void
}

interface OpcionesReporte {
  nombre: string
  descripcion: string
  formato: 'pdf' | 'excel' | 'ambos'
  modulos: string[]
  incluirGraficos: boolean
  incluirResumen: boolean
  incluirDetalles: boolean
  proyectos: string[]
  fechaInicio?: Date
  fechaFin?: Date
  agruparPor: 'proyecto' | 'fecha' | 'categoria' | 'trabajador'
}

interface Proyecto {
  id: string
  nombre: string
  estado: string
}

export function GeneradorReportes({ onMensaje }: GeneradorReportesProps) {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const { generarReporte: ejecutarReporte, generando, progreso } = useGenerarReportes()
  const [opciones, setOpciones] = useState<OpcionesReporte>({
    nombre: '',
    descripcion: '',
    formato: 'pdf',
    modulos: [],
    incluirGraficos: true,
    incluirResumen: true,
    incluirDetalles: true,
    proyectos: [],
    agruparPor: 'proyecto'
  })

  const modulosDisponibles = [
    { id: 'proyectos', nombre: 'Proyectos', descripcion: 'Información general y estado de proyectos' },
    { id: 'gastos', nombre: 'Gastos', descripcion: 'Detalle de gastos por proyecto y categoría' },
    { id: 'pagos', nombre: 'Pagos', descripcion: 'Pagos realizados a trabajadores' },
    { id: 'evidencias', nombre: 'Evidencias', descripcion: 'Documentos y fotografías de evidencia' }
  ]

  const tiposAgrupacion = [
    { value: 'proyecto', label: 'Por Proyecto' },
    { value: 'fecha', label: 'Por Fecha' },
    { value: 'categoria', label: 'Por Categoría' },
    { value: 'trabajador', label: 'Por Trabajador' }
  ]

  const plantillasPredefinas = [
    {
      nombre: 'Informe Ejecutivo Mensual',
      descripcion: 'Resumen ejecutivo con gráficos y estadísticas principales',
      modulos: ['proyectos', 'gastos', 'pagos'],
      incluirGraficos: true,
      incluirResumen: true,
      incluirDetalles: false,
      agruparPor: 'proyecto' as const
    },
    {
      nombre: 'Reporte Financiero Detallado',
      descripcion: 'Análisis completo de gastos y pagos con detalles',
      modulos: ['gastos', 'pagos'],
      incluirGraficos: true,
      incluirResumen: true,
      incluirDetalles: true,
      agruparPor: 'categoria' as const
    },
    {
      nombre: 'Estado de Proyectos',
      descripcion: 'Avance y documentación de todos los proyectos',
      modulos: ['proyectos', 'evidencias'],
      incluirGraficos: false,
      incluirResumen: true,
      incluirDetalles: true,
      agruparPor: 'proyecto' as const
    }
  ]

  useEffect(() => {
    cargarProyectos()
  }, [])

  const cargarProyectos = async () => {
    try {
      const { data, error } = await supabase
        .from('proyectos')
        .select('id, nombre, estado')
        .order('nombre')

      if (error) throw error
      setProyectos(data || [])
    } catch (error) {
      console.error('Error al cargar proyectos:', error)
    }
  }

  const actualizarOpciones = (nuevasOpciones: Partial<OpcionesReporte>) => {
    setOpciones({ ...opciones, ...nuevasOpciones })
  }

  const toggleModulo = (moduloId: string) => {
    const nuevosModulos = opciones.modulos.includes(moduloId)
      ? opciones.modulos.filter(id => id !== moduloId)
      : [...opciones.modulos, moduloId]
    
    actualizarOpciones({ modulos: nuevosModulos })
  }

  const toggleProyecto = (proyectoId: string) => {
    const nuevosProyectos = opciones.proyectos.includes(proyectoId)
      ? opciones.proyectos.filter(id => id !== proyectoId)
      : [...opciones.proyectos, proyectoId]
    
    actualizarOpciones({ proyectos: nuevosProyectos })
  }

  const aplicarPlantilla = (plantilla: typeof plantillasPredefinas[0]) => {
    actualizarOpciones({
      nombre: plantilla.nombre,
      descripcion: plantilla.descripcion,
      modulos: plantilla.modulos,
      incluirGraficos: plantilla.incluirGraficos,
      incluirResumen: plantilla.incluirResumen,
      incluirDetalles: plantilla.incluirDetalles,
      agruparPor: plantilla.agruparPor
    })
  }

  const validarOpciones = (): string | null => {
    if (!opciones.nombre.trim()) {
      return 'El nombre del reporte es obligatorio'
    }
    if (opciones.modulos.length === 0) {
      return 'Debes seleccionar al menos un módulo'
    }
    if (opciones.proyectos.length === 0) {
      return 'Debes seleccionar al menos un proyecto'
    }
    return null
  }
  const generarReporte = async () => {
    const error = validarOpciones()
    if (error) {
      onMensaje('error', error)
      return
    }

    try {      // Configurar filtros para la generación
      const filtros = {
        proyectos: opciones.proyectos,
        fechaInicio: opciones.fechaInicio,
        fechaFin: opciones.fechaFin
      }

      // Configurar opciones para el hook
      const opcionesReporte = {
        titulo: opciones.nombre,
        descripcion: opciones.descripcion,
        formato: opciones.formato,
        modulos: opciones.modulos,
        incluirGraficos: opciones.incluirGraficos,
        incluirResumen: opciones.incluirResumen,
        incluirDetalles: opciones.incluirDetalles,
        agruparPor: opciones.agruparPor
      }

      const resultado = await ejecutarReporte(opcionesReporte, filtros)
      
      if (resultado.success) {
        onMensaje('success', `Reporte "${opciones.nombre}" generado exitosamente`)
        
        // Limpiar formulario
        setOpciones({
          nombre: '',
          descripcion: '',
          formato: 'pdf',
          modulos: [],
          incluirGraficos: true,
          incluirResumen: true,
          incluirDetalles: true,
          proyectos: [],
          agruparPor: 'proyecto'
        })
      } else {
        onMensaje('error', resultado.error || 'Error al generar el reporte')
      }
      
    } catch (error) {
      console.error('Error al generar reporte:', error)
      onMensaje('error', 'Error al generar el reporte. Inténtalo de nuevo.')
    }
  }

  const previsualizarReporte = async () => {
    const error = validarOpciones()
    if (error) {
      onMensaje('error', error)
      return
    }

    // Aquí iría la lógica para mostrar una previsualización
    onMensaje('success', 'Previsualización disponible (funcionalidad en desarrollo)')
  }

  return (
    <div className="space-y-6">
      {/* Plantillas Predefinidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Plantillas Predefinidas
          </CardTitle>
          <CardDescription>Selecciona una plantilla para comenzar rápidamente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {plantillasPredefinas.map((plantilla, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{plantilla.nombre}</CardTitle>
                  <CardDescription className="text-xs">{plantilla.descripcion}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1 mb-3">
                    {plantilla.modulos.map(modulo => (
                      <Badge key={modulo} variant="secondary" className="text-xs">
                        {modulosDisponibles.find(m => m.id === modulo)?.nombre}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => aplicarPlantilla(plantilla)}
                  >
                    Usar Plantilla
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuración del Reporte */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Información General */}
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>Configura los detalles básicos del reporte</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre del Reporte *</Label>
              <Input
                id="nombre"
                placeholder="Ej: Informe Mensual Enero 2024"
                value={opciones.nombre}
                onChange={(e) => actualizarOpciones({ nombre: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                placeholder="Descripción opcional del reporte..."
                value={opciones.descripcion}
                onChange={(e) => actualizarOpciones({ descripcion: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label>Formato de Salida</Label>
              <Select value={opciones.formato} onValueChange={(value: 'pdf' | 'excel' | 'ambos') => actualizarOpciones({ formato: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      PDF
                    </div>
                  </SelectItem>
                  <SelectItem value="excel">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Excel
                    </div>
                  </SelectItem>
                  <SelectItem value="ambos">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Ambos formatos
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Agrupar Datos Por</Label>
              <Select value={opciones.agruparPor} onValueChange={(value: OpcionesReporte['agruparPor']) => actualizarOpciones({ agruparPor: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposAgrupacion.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Opciones de Contenido */}
        <Card>
          <CardHeader>
            <CardTitle>Opciones de Contenido</CardTitle>
            <CardDescription>Selecciona qué incluir en el reporte</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Módulos */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Módulos a Incluir *</Label>
              <div className="space-y-3">
                {modulosDisponibles.map((modulo) => (
                  <div key={modulo.id} className="flex items-start space-x-3">
                    <Checkbox
                      checked={opciones.modulos.includes(modulo.id)}
                      onCheckedChange={() => toggleModulo(modulo.id)}
                    />
                    <div className="flex-1">
                      <Label className="text-sm font-medium cursor-pointer">
                        {modulo.nombre}
                      </Label>
                      <p className="text-xs text-gray-500">{modulo.descripcion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Opciones de Visualización */}
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-sm font-medium">Opciones de Visualización</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={opciones.incluirGraficos}
                  onCheckedChange={(checked) => actualizarOpciones({ incluirGraficos: !!checked })}
                />
                <Label className="text-sm cursor-pointer flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Incluir gráficos y visualizaciones
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={opciones.incluirResumen}
                  onCheckedChange={(checked) => actualizarOpciones({ incluirResumen: !!checked })}
                />
                <Label className="text-sm cursor-pointer flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Incluir resumen ejecutivo
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={opciones.incluirDetalles}
                  onCheckedChange={(checked) => actualizarOpciones({ incluirDetalles: !!checked })}
                />
                <Label className="text-sm cursor-pointer flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Incluir detalles y tablas completas
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selección de Proyectos */}
      <Card>
        <CardHeader>
          <CardTitle>Proyectos a Incluir</CardTitle>
          <CardDescription>Selecciona los proyectos que deseas incluir en el reporte</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
            {proyectos.map((proyecto) => (
              <div key={proyecto.id} className="flex items-center space-x-2 p-2 border rounded">
                <Checkbox
                  checked={opciones.proyectos.includes(proyecto.id)}
                  onCheckedChange={() => toggleProyecto(proyecto.id)}
                />
                <div className="flex-1">
                  <Label className="text-sm cursor-pointer font-medium">
                    {proyecto.nombre}
                  </Label>
                  <Badge 
                    variant={proyecto.estado === 'activo' ? 'default' : 'secondary'}
                    className="ml-2 text-xs"
                  >
                    {proyecto.estado}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          {proyectos.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No hay proyectos disponibles
            </p>
          )}
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div className="text-sm text-gray-600">
          {opciones.modulos.length > 0 && opciones.proyectos.length > 0 && (
            <span>
              {opciones.modulos.length} módulo{opciones.modulos.length !== 1 ? 's' : ''} • {' '}
              {opciones.proyectos.length} proyecto{opciones.proyectos.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
          <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={previsualizarReporte}
            disabled={generando}
          >
            <Eye className="h-4 w-4 mr-2" />
            Previsualizar
          </Button>
          
          <Button
            onClick={generarReporte}
            disabled={generando}
            className="bg-red-600 hover:bg-red-700"
          >
            {generando ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generar Reporte
              </>
            )}
          </Button>
        </div>
        
        {/* Barra de progreso cuando se está generando */}
        {generando && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Generando reporte...</span>
              <span className="text-gray-600">{progreso}%</span>
            </div>
            <Progress value={progreso} className="w-full" />
          </div>
        )}
      </div>
    </div>
  )
}
