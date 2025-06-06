"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Filter, 
  X, 
  Calendar as CalendarIcon, 
  DollarSign,
  User,
  RotateCcw,
  ChevronDown,
  TrendingUp,
  Briefcase,
  FileText,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { PagoPersonal, Proyecto, Trabajador } from "@/lib/types"

interface PagoConDetalles extends PagoPersonal {
  proyecto?: Proyecto
  trabajador?: Trabajador
}

interface FiltrosPagosProps {
  pagos: PagoConDetalles[]
  proyectos: Proyecto[]
  trabajadores: Trabajador[]
  onFiltrarPagos: (pagosFiltrados: PagoConDetalles[]) => void
  className?: string
}

interface FiltrosState {
  busqueda: string
  tipoLabor: string
  proyecto: string
  trabajador: string
  fechaInicio: string
  fechaFin: string
  montoMin: string
  montoMax: string
  estado: string
  horasMin: string
  horasMax: string
}

const TIPOS_LABOR = [
  { value: "docencia", label: "Docencia", icon: "👨‍🏫" },
  { value: "coordinacion", label: "Coordinación", icon: "👥" },
  { value: "produccion", label: "Producción", icon: "🎬" },
  { value: "logistica", label: "Logística", icon: "📋" },
  { value: "tecnico", label: "Técnico", icon: "🔧" },
  { value: "artistico", label: "Artístico", icon: "🎨" },
  { value: "otros", label: "Otros", icon: "📌" },
]

function FiltrosPagos({ pagos, proyectos, trabajadores, onFiltrarPagos, className }: FiltrosPagosProps) {
  const [filtros, setFiltros] = useState<FiltrosState>({
    busqueda: "",
    tipoLabor: "all",
    proyecto: "all",
    trabajador: "all",
    fechaInicio: "",
    fechaFin: "",
    montoMin: "",
    montoMax: "",
    estado: "all",
    horasMin: "",
    horasMax: "",
  })

  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false)
  const [pagosVisibles, setPagosVisibles] = useState(pagos)
  // Obtener valores únicos para los filtros
  const trabajadoresUnicos = pagos
    .map(p => p.trabajador)
    .filter((t): t is Trabajador => t != null)
    .filter((trabajador, index, array) => 
      array.findIndex(t => t.id === trabajador.id) === index
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  useEffect(() => {
    aplicarFiltros()
    // eslint-disable-next-line
  }, [filtros, pagos])

  const aplicarFiltros = () => {
    let pagosFiltrados = [...pagos]

    // Filtro por búsqueda
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase()
      pagosFiltrados = pagosFiltrados.filter(pago =>
        pago.trabajador?.nombre.toLowerCase().includes(busqueda) ||
        pago.proyecto?.nombre.toLowerCase().includes(busqueda) ||
        pago.tipo_labor.toLowerCase().includes(busqueda) ||
        pago.observaciones?.toLowerCase().includes(busqueda) ||
        pago.trabajador?.especialidad?.toLowerCase().includes(busqueda)
      )
    }

    // Filtro por tipo de labor
    if (filtros.tipoLabor && filtros.tipoLabor !== "all") {
      pagosFiltrados = pagosFiltrados.filter(pago => 
        pago.tipo_labor === filtros.tipoLabor
      )
    }

    // Filtro por proyecto
    if (filtros.proyecto && filtros.proyecto !== "all") {
      pagosFiltrados = pagosFiltrados.filter(pago => 
        pago.proyecto_id === filtros.proyecto
      )
    }

    // Filtro por trabajador
    if (filtros.trabajador && filtros.trabajador !== "all") {
      pagosFiltrados = pagosFiltrados.filter(pago => 
        pago.trabajador_id === filtros.trabajador
      )
    }

    // Filtro por fecha inicio
    if (filtros.fechaInicio) {
      pagosFiltrados = pagosFiltrados.filter(pago => 
        pago.fecha_actividad >= filtros.fechaInicio
      )
    }

    // Filtro por fecha fin
    if (filtros.fechaFin) {
      pagosFiltrados = pagosFiltrados.filter(pago => 
        pago.fecha_actividad <= filtros.fechaFin
      )
    }

    // Filtro por monto mínimo
    if (filtros.montoMin) {
      const montoMin = parseFloat(filtros.montoMin)
      pagosFiltrados = pagosFiltrados.filter(pago => 
        Number(pago.valor_pactado) >= montoMin
      )
    }

    // Filtro por monto máximo
    if (filtros.montoMax) {
      const montoMax = parseFloat(filtros.montoMax)
      pagosFiltrados = pagosFiltrados.filter(pago => 
        Number(pago.valor_pactado) <= montoMax
      )
    }    // Filtro por horas mínimas
    if (filtros.horasMin) {
      const horasMin = parseFloat(filtros.horasMin)
      pagosFiltrados = pagosFiltrados.filter(pago => 
        pago.horas_trabajadas !== null && Number(pago.horas_trabajadas) >= horasMin
      )
    }

    // Filtro por horas máximas
    if (filtros.horasMax) {
      const horasMax = parseFloat(filtros.horasMax)
      pagosFiltrados = pagosFiltrados.filter(pago => 
        pago.horas_trabajadas !== null && Number(pago.horas_trabajadas) <= horasMax
      )
    }

    // Filtro por estado
    if (filtros.estado && filtros.estado !== "all") {
      pagosFiltrados = pagosFiltrados.filter(pago => 
        pago.estado_pago === filtros.estado
      )
    }

    setPagosVisibles(pagosFiltrados)
    onFiltrarPagos(pagosFiltrados)
  }
  
  const limpiarFiltros = () => {
    setFiltros({
      busqueda: "",
      tipoLabor: "all",
      proyecto: "all",
      trabajador: "all",
      fechaInicio: "",
      fechaFin: "",
      montoMin: "",
      montoMax: "",
      estado: "all",
      horasMin: "",
      horasMax: "",
    })
    setMostrarFiltrosAvanzados(false)
  }

  const actualizarFiltro = (campo: keyof FiltrosState, valor: string) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }))
  }

  const hayFiltrosActivos = Object.entries(filtros).some(([key, value]) => {
    if (key === "busqueda") return value !== ""
    if (["fechaInicio", "fechaFin", "montoMin", "montoMax", "horasMin", "horasMax"].includes(key)) return value !== ""
    return value !== "all"
  })

  return (
    <Card className={cn("mb-6", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Filtros de Pagos</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              {pagosVisibles.length} resultado{pagosVisibles.length !== 1 ? 's' : ''}
            </Badge>
            {hayFiltrosActivos && (
              <Button
                variant="ghost"
                size="sm"
                onClick={limpiarFiltros}
                className="h-7 px-2 text-gray-600 hover:text-red-600 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 pt-2 pb-4">
        {/* Búsqueda principal */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por trabajador, proyecto, tipo de labor..."
            value={filtros.busqueda}
            onChange={(e) => actualizarFiltro("busqueda", e.target.value)}
            className="pl-10 h-10 text-sm"
          />
        </div>

        {/* Filtros rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Tipo de Labor
            </label>
            <Select value={filtros.tipoLabor} onValueChange={(value) => actualizarFiltro("tipoLabor", value)}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {TIPOS_LABOR.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    <span className="flex items-center gap-2">
                      <span>{tipo.icon}</span>
                      {tipo.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Proyecto
            </label>
            <Select value={filtros.proyecto} onValueChange={(value) => actualizarFiltro("proyecto", value)}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Todos los proyectos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los proyectos</SelectItem>
                {proyectos.map((proyecto) => (
                  <SelectItem key={proyecto.id} value={proyecto.id}>
                    {proyecto.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <User className="h-4 w-4" />
              Trabajador
            </label>
            <Select value={filtros.trabajador} onValueChange={(value) => actualizarFiltro("trabajador", value)}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Todos los trabajadores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los trabajadores</SelectItem>
                {trabajadoresUnicos.map((trabajador) => (
                  <SelectItem key={trabajador.id} value={trabajador.id}>
                    {trabajador.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Estado</label>
            <Select value={filtros.estado} onValueChange={(value) => actualizarFiltro("estado", value)}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    Pendientes
                  </span>
                </SelectItem>
                <SelectItem value="pagado">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Pagados
                  </span>
                </SelectItem>
                <SelectItem value="cancelado">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Cancelados
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Botón para filtros avanzados */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros Avanzados
            <ChevronDown className={cn("h-4 w-4 transition-transform", mostrarFiltrosAvanzados && "rotate-180")} />
          </Button>
        </div>

        {/* Filtros avanzados */}
        {mostrarFiltrosAvanzados && (
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Fecha inicio */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Fecha desde
                </label>
                <Input
                  type="date"
                  value={filtros.fechaInicio}
                  onChange={(e) => actualizarFiltro("fechaInicio", e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Fecha fin */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Fecha hasta
                </label>
                <Input
                  type="date"
                  value={filtros.fechaFin}
                  onChange={(e) => actualizarFiltro("fechaFin", e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Monto mínimo */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Monto mínimo
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="number"
                    placeholder="Sin límite"
                    value={filtros.montoMin}
                    onChange={(e) => actualizarFiltro("montoMin", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Monto máximo */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Monto máximo
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="number"
                    placeholder="Sin límite"
                    value={filtros.montoMax}
                    onChange={(e) => actualizarFiltro("montoMax", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Horas mínimas */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horas mínimas
                </label>
                <Input
                  type="number"
                  placeholder="Sin límite"
                  value={filtros.horasMin}
                  onChange={(e) => actualizarFiltro("horasMin", e.target.value)}
                />
              </div>

              {/* Horas máximas */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horas máximas
                </label>
                <Input
                  type="number"
                  placeholder="Sin límite"
                  value={filtros.horasMax}
                  onChange={(e) => actualizarFiltro("horasMax", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Filtros activos */}
        {hayFiltrosActivos && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {filtros.busqueda && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Search className="h-3 w-3" />
                Búsqueda: "{filtros.busqueda}"
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => actualizarFiltro("busqueda", "")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            {filtros.tipoLabor && filtros.tipoLabor !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {TIPOS_LABOR.find(t => t.value === filtros.tipoLabor)?.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => actualizarFiltro("tipoLabor", "all")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            {filtros.proyecto && filtros.proyecto !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Proyecto: {proyectos.find(p => p.id === filtros.proyecto)?.nombre}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => actualizarFiltro("proyecto", "all")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            {filtros.trabajador && filtros.trabajador !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Trabajador: {trabajadoresUnicos.find(t => t.id === filtros.trabajador)?.nombre}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => actualizarFiltro("trabajador", "all")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            {filtros.estado && filtros.estado !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Estado: {filtros.estado === "pagado" ? "Pagados" : filtros.estado === "pendiente" ? "Pendientes" : "Cancelados"}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => actualizarFiltro("estado", "all")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        )}      </CardContent>
    </Card>
  )
}

export default FiltrosPagos
