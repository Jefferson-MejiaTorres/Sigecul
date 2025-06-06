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
  Tag,
  User,
  RotateCcw,
  ChevronDown,
  TrendingUp
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { GastoProyecto, Proyecto } from "@/lib/types"

interface FiltrosGastosProps {
  gastos: Array<GastoProyecto & { proyecto?: Proyecto }>
  proyectos: Proyecto[]
  onFiltrarGastos: (gastosFiltrados: Array<GastoProyecto & { proyecto?: Proyecto }>) => void
  className?: string
}

interface FiltrosState {
  busqueda: string
  tipoGasto: string
  proyecto: string
  responsable: string
  fechaInicio: string
  fechaFin: string
  montoMin: string
  montoMax: string
  estado: string
}

const TIPOS_GASTO = [
  { value: "honorarios", label: "Honorarios", icon: "👔" },
  { value: "refrigerios", label: "Refrigerios", icon: "🍽️" },
  { value: "transporte", label: "Transporte", icon: "🚗" },
  { value: "materiales", label: "Materiales", icon: "📦" },
  { value: "servicios", label: "Servicios", icon: "⚙️" },
  { value: "otros", label: "Otros", icon: "📋" }
]

export function FiltrosGastos({ gastos, proyectos, onFiltrarGastos, className }: FiltrosGastosProps) {  const [filtros, setFiltros] = useState<FiltrosState>({
    busqueda: "",
    tipoGasto: "all",
    proyecto: "all",
    responsable: "all",
    fechaInicio: "",
    fechaFin: "",
    montoMin: "",
    montoMax: "",
    estado: "all"
  })

  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false)
  const [gastosVisibles, setGastosVisibles] = useState(gastos)
  // Obtener valores únicos para los filtros
  const responsablesUnicos = Array.from(new Set(gastos
    .map(g => g.responsable)
    .filter((r): r is string => r != null && r.trim() !== '')
  )).sort()

  useEffect(() => {
    aplicarFiltros()
  }, [filtros, gastos])

  const aplicarFiltros = () => {
    let gastosFiltrados = [...gastos]

    // Filtro por búsqueda (descripción o proyecto)
    if (filtros.busqueda.trim()) {
      const termino = filtros.busqueda.toLowerCase().trim()
      gastosFiltrados = gastosFiltrados.filter(gasto => 
        gasto.descripcion.toLowerCase().includes(termino) ||
        gasto.proyecto?.nombre.toLowerCase().includes(termino) ||
        gasto.responsable?.toLowerCase().includes(termino)
      )
    }    // Filtro por tipo de gasto
    if (filtros.tipoGasto && filtros.tipoGasto !== "all") {
      gastosFiltrados = gastosFiltrados.filter(gasto => 
        gasto.tipo_gasto === filtros.tipoGasto
      )
    }

    // Filtro por proyecto
    if (filtros.proyecto && filtros.proyecto !== "all") {
      gastosFiltrados = gastosFiltrados.filter(gasto => 
        gasto.proyecto_id === filtros.proyecto
      )
    }

    // Filtro por responsable
    if (filtros.responsable && filtros.responsable !== "all") {
      gastosFiltrados = gastosFiltrados.filter(gasto => 
        gasto.responsable === filtros.responsable
      )
    }// Filtro por fecha de inicio
    if (filtros.fechaInicio) {
      gastosFiltrados = gastosFiltrados.filter(gasto => 
        new Date(gasto.fecha_gasto) >= new Date(filtros.fechaInicio)
      )
    }

    // Filtro por fecha de fin
    if (filtros.fechaFin) {
      gastosFiltrados = gastosFiltrados.filter(gasto => 
        new Date(gasto.fecha_gasto) <= new Date(filtros.fechaFin)
      )
    }

    // Filtro por monto mínimo
    if (filtros.montoMin) {
      const montoMin = parseFloat(filtros.montoMin)
      if (!isNaN(montoMin)) {
        gastosFiltrados = gastosFiltrados.filter(gasto => 
          Number(gasto.monto) >= montoMin
        )
      }
    }

    // Filtro por monto máximo
    if (filtros.montoMax) {
      const montoMax = parseFloat(filtros.montoMax)
      if (!isNaN(montoMax)) {
        gastosFiltrados = gastosFiltrados.filter(gasto => 
          Number(gasto.monto) <= montoMax
        )
      }
    }    // Filtro por estado
    if (filtros.estado && filtros.estado !== "all") {
      const esAprobado = filtros.estado === "aprobado"
      gastosFiltrados = gastosFiltrados.filter(gasto => 
        gasto.aprobado === esAprobado
      )
    }    setGastosVisibles(gastosFiltrados)
    onFiltrarGastos(gastosFiltrados)
  }
  
  const limpiarFiltros = () => {
    setFiltros({
      busqueda: "",
      tipoGasto: "all",
      proyecto: "all",
      responsable: "all",
      fechaInicio: "",
      fechaFin: "",
      montoMin: "",
      montoMax: "",
      estado: "all"
    })
    setMostrarFiltrosAvanzados(false)
  }

  const actualizarFiltro = (campo: keyof FiltrosState, valor: any) => {
    setFiltros(prev => ({
      ...prev,      [campo]: valor
    }))
  }
  
  const hayFiltrosActivos = Object.entries(filtros).some(([key, valor]) => {
    if (key === "tipoGasto" || key === "proyecto" || key === "responsable" || key === "estado") {
      return valor !== "all" && valor !== ""
    }
    return valor !== "" && valor !== undefined && valor !== null
  })

  const contadorFiltrosActivos = Object.entries(filtros).filter(([key, valor]) => {
    if (key === "tipoGasto" || key === "proyecto" || key === "responsable" || key === "estado") {
      return valor !== "all" && valor !== ""
    }
    return valor !== "" && valor !== undefined && valor !== null
  }).length
  return (
    <Card className={cn("mb-4", className)}>
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-red-600" />
            <CardTitle className="text-base">Filtros de Búsqueda</CardTitle>
            {hayFiltrosActivos && (
              <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                {contadorFiltrosActivos} activo{contadorFiltrosActivos !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              {gastosVisibles.length} resultado{gastosVisibles.length !== 1 ? 's' : ''}
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
            placeholder="Buscar por descripción, proyecto o responsable..."
            value={filtros.busqueda}            onChange={(e) => actualizarFiltro("busqueda", e.target.value)}
            className="pl-10 h-10 text-sm"
          />
        </div>        {/* Filtros rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tipo de Gasto
            </label>
            <Select value={filtros.tipoGasto} onValueChange={(value) => actualizarFiltro("tipoGasto", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {TIPOS_GASTO.map((tipo) => (
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
              <User className="h-4 w-4" />
              Proyecto
            </label>
            <Select value={filtros.proyecto} onValueChange={(value) => actualizarFiltro("proyecto", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los proyectos" />
              </SelectTrigger>              <SelectContent>
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
            <label className="text-sm font-medium text-gray-700">Estado</label>
            <Select value={filtros.estado} onValueChange={(value) => actualizarFiltro("estado", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="aprobado">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Aprobados
                  </span>
                </SelectItem>
                <SelectItem value="pendiente">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    Pendientes
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
              {/* Responsable */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Responsable</label>
                <Select value={filtros.responsable} onValueChange={(value) => actualizarFiltro("responsable", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>                  <SelectContent>
                    <SelectItem value="all">Todos los responsables</SelectItem>
                    {responsablesUnicos.map((responsable) => (
                      <SelectItem key={responsable} value={responsable}>
                        {responsable}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>              {/* Fecha inicio */}
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
              </div>              {/* Monto mínimo */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Monto mínimo
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="number"
                    placeholder="0"
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
            )}            {filtros.tipoGasto && filtros.tipoGasto !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {TIPOS_GASTO.find(t => t.value === filtros.tipoGasto)?.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => actualizarFiltro("tipoGasto", "all")}
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
            {filtros.estado && filtros.estado !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Estado: {filtros.estado === "aprobado" ? "Aprobados" : "Pendientes"}
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
        )}
      </CardContent>
    </Card>
  )
}
