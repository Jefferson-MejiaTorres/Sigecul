"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Filter, 
  X, 
  CalendarIcon,
  FolderOpen,
  Settings
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { supabase } from "@/lib/supabase"

interface FiltrosData {
  fechaInicio?: Date
  fechaFin?: Date
  proyectos: string[]
  modulos: string[]
  estados: string[]
  montoMinimo?: number
  montoMaximo?: number
}

interface Proyecto {
  id: string
  nombre: string
  estado: string
}

interface FiltrosReportesProps {
  onFiltrosChange?: (filtros: FiltrosData) => void
  filtrosActivos?: FiltrosData
}

export function FiltrosReportes({ onFiltrosChange, filtrosActivos }: FiltrosReportesProps) {
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [filtros, setFiltros] = useState<FiltrosData>(filtrosActivos || {
    proyectos: [],
    modulos: [],
    estados: []
  })

  const modulosDisponibles = [
    { id: 'proyectos', nombre: 'Proyectos' },
    { id: 'gastos', nombre: 'Gastos' },
    { id: 'pagos', nombre: 'Pagos' }, 
    { id: 'evidencias', nombre: 'Evidencias' }
  ]

  const estadosDisponibles = [
    { id: 'activo', nombre: 'Activo' },
    { id: 'completado', nombre: 'Completado' },
    { id: 'en_pausa', nombre: 'En Pausa' },
    { id: 'cancelado', nombre: 'Cancelado' }
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

  const actualizarFiltros = (nuevosFiltros: Partial<FiltrosData>) => {
    const filtrosActualizados = { ...filtros, ...nuevosFiltros }
    setFiltros(filtrosActualizados)
    onFiltrosChange?.(filtrosActualizados)
  }

  const limpiarFiltros = () => {
    const filtrosVacios = {
      proyectos: [],
      modulos: [],
      estados: []
    }
    setFiltros(filtrosVacios)
    onFiltrosChange?.(filtrosVacios)
  }

  const toggleProyecto = (proyectoId: string) => {
    const nuevosProyectos = filtros.proyectos.includes(proyectoId)
      ? filtros.proyectos.filter(id => id !== proyectoId)
      : [...filtros.proyectos, proyectoId]
    
    actualizarFiltros({ proyectos: nuevosProyectos })
  }

  const toggleModulo = (moduloId: string) => {
    const nuevosModulos = filtros.modulos.includes(moduloId)
      ? filtros.modulos.filter(id => id !== moduloId)
      : [...filtros.modulos, moduloId]
    
    actualizarFiltros({ modulos: nuevosModulos })
  }

  const toggleEstado = (estadoId: string) => {
    const nuevosEstados = filtros.estados.includes(estadoId)
      ? filtros.estados.filter(id => id !== estadoId)
      : [...filtros.estados, estadoId]
    
    actualizarFiltros({ estados: nuevosEstados })
  }

  const contarFiltrosActivos = () => {
    let count = 0
    if (filtros.fechaInicio || filtros.fechaFin) count++
    if (filtros.proyectos.length > 0) count++
    if (filtros.modulos.length > 0) count++
    if (filtros.estados.length > 0) count++
    if (filtros.montoMinimo || filtros.montoMaximo) count++
    return count
  }

  const filtrosCount = contarFiltrosActivos()

  return (
    <div className="flex items-center gap-2">
      <Popover open={mostrarFiltros} onOpenChange={setMostrarFiltros}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {filtrosCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500">
                {filtrosCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Filtros de Reporte</CardTitle>
                  <CardDescription>Personaliza los datos a incluir</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMostrarFiltros(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Rango de Fechas */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Rango de Fechas</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">Desde</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filtros.fechaInicio ? (
                            format(filtros.fechaInicio, "P", { locale: es })
                          ) : (
                            "Seleccionar"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filtros.fechaInicio}
                          onSelect={(date) => actualizarFiltros({ fechaInicio: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Hasta</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filtros.fechaFin ? (
                            format(filtros.fechaFin, "P", { locale: es })
                          ) : (
                            "Seleccionar"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filtros.fechaFin}
                          onSelect={(date) => actualizarFiltros({ fechaFin: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Proyectos */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Proyectos</Label>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {proyectos.map((proyecto) => (
                    <div key={proyecto.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={filtros.proyectos.includes(proyecto.id)}
                        onCheckedChange={() => toggleProyecto(proyecto.id)}
                      />
                      <Label className="text-sm flex-1 cursor-pointer">
                        {proyecto.nombre}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Módulos */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Módulos</Label>
                <div className="space-y-2">
                  {modulosDisponibles.map((modulo) => (
                    <div key={modulo.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={filtros.modulos.includes(modulo.id)}
                        onCheckedChange={() => toggleModulo(modulo.id)}
                      />
                      <Label className="text-sm cursor-pointer">
                        {modulo.nombre}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Estados */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Estados</Label>
                <div className="space-y-2">
                  {estadosDisponibles.map((estado) => (
                    <div key={estado.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={filtros.estados.includes(estado.id)}
                        onCheckedChange={() => toggleEstado(estado.id)}
                      />
                      <Label className="text-sm cursor-pointer">
                        {estado.nombre}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rango de Montos */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Rango de Montos (COP)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">Mínimo</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filtros.montoMinimo || ''}
                      onChange={(e) => actualizarFiltros({ 
                        montoMinimo: e.target.value ? Number(e.target.value) : undefined 
                      })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Máximo</Label>
                    <Input
                      type="number"
                      placeholder="Sin límite"
                      value={filtros.montoMaximo || ''}
                      onChange={(e) => actualizarFiltros({ 
                        montoMaximo: e.target.value ? Number(e.target.value) : undefined 
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={limpiarFiltros}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpiar
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setMostrarFiltros(false)}
                  className="flex-1"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Aplicar
                </Button>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>

      {/* Mostrar filtros activos */}
      {filtrosCount > 0 && (
        <div className="flex items-center gap-2">
          {filtros.proyectos.length > 0 && (
            <Badge variant="secondary">
              {filtros.proyectos.length} proyecto{filtros.proyectos.length !== 1 ? 's' : ''}
            </Badge>
          )}
          {filtros.modulos.length > 0 && (
            <Badge variant="secondary">
              {filtros.modulos.length} módulo{filtros.modulos.length !== 1 ? 's' : ''}
            </Badge>
          )}
          {(filtros.fechaInicio || filtros.fechaFin) && (
            <Badge variant="secondary">
              Fechas
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
