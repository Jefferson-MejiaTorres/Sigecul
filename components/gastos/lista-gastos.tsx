"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Loader2,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  User,
  FileText,
  MoreHorizontal,
  AlertCircle,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useGastosUpdate } from "@/components/gastos/gastos-update-context"
import type { GastoProyecto, Proyecto } from "@/lib/types"
import Link from "next/link"
import { formatCOP } from "@/lib/format-cop"
import { useRouter } from "next/navigation"

interface GastoConProyecto extends GastoProyecto {
  proyecto?: Proyecto
}

interface ListaGastosProps {
  filtro?: "todos" | "pendientes" | "aprobados"
  gastos?: GastoConProyecto[]
  proyectos?: Proyecto[]
  showFilters?: boolean
}

export function ListaGastos({ filtro = "todos", gastos: gastosExternas, proyectos: proyectosExternas, showFilters = true }: ListaGastosProps) {
  const [gastosOriginales, setGastosOriginales] = useState<GastoConProyecto[]>([])
  const [gastosFiltrados, setGastosFiltrados] = useState<GastoConProyecto[]>([])
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingEstado, setUpdatingEstado] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { lastUpdate, triggerUpdate } = useGastosUpdate()

  // Si se proporcionan gastos externos, usarlos en lugar de cargar desde la base de datos
  const usingExternalData = !!gastosExternas && !!proyectosExternas

  useEffect(() => {
    if (usingExternalData) {
      setGastosOriginales(gastosExternas!)
      setGastosFiltrados(gastosExternas!)
      setProyectos(proyectosExternas!)
      setLoading(false)
    } else if (user && showFilters) {
      fetchGastos()
    }
  }, [user, filtro, lastUpdate, gastosExternas, proyectosExternas, usingExternalData, showFilters])

  // Aplicar filtros cuando cambien los filtros o los gastos originales
  useEffect(() => {
    if (gastosOriginales.length > 0) {
      // const gastosFiltradosResult = aplicarFiltros(gastosOriginales, proyectos)
      setGastosFiltrados(gastosOriginales)
    } else {
      setGastosFiltrados([])
    }
  }, [gastosOriginales, proyectos])

  const fetchGastos = async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener proyectos del supervisor
      const { data: proyectosData, error: proyectosError } = await supabase
        .from("proyectos")
        .select("*")
        .eq("supervisor_id", user?.id)

      if (proyectosError) {
        throw proyectosError
      }

      if (!proyectosData || proyectosData.length === 0) {
        setGastosOriginales([])
        setGastosFiltrados([])
        setProyectos([])
        setLoading(false)
        return
      }

      setProyectos(proyectosData)
      const proyectoIds = proyectosData.map((p) => p.id)

      // Construir query de gastos
      let query = supabase.from("gastos_proyecto").select("*").in("proyecto_id", proyectoIds)

      // Aplicar filtro de estado según la pestaña
      if (filtro === "pendientes") {
        query = query.eq("aprobado", false)
      } else if (filtro === "aprobados") {
        query = query.eq("aprobado", true)
      }

      const { data: gastosData, error: gastosError } = await query.order("fecha_gasto", { ascending: false })

      if (gastosError) {
        throw gastosError
      }

      // Combinar gastos con información del proyecto
      const gastosConProyecto =
        gastosData?.map((gasto) => ({
          ...gasto,
          proyecto: proyectosData.find((p) => p.id === gasto.proyecto_id),
        })) || []

      setGastosOriginales(gastosConProyecto)
    } catch (err: any) {
      setError(err.message || "Error al cargar los gastos")
      console.error("Error al cargar gastos:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleEstadoChange = async (gastoId: string, aprobado: boolean) => {
    try {
      setUpdatingEstado(gastoId)

      const { error } = await supabase.from("gastos_proyecto").update({ aprobado }).eq("id", gastoId)

      if (error) {
        throw error
      }

      // Actualizar estado local en ambas listas
      const updateGasto = (gasto: GastoConProyecto) => (gasto.id === gastoId ? { ...gasto, aprobado } : gasto)
      setGastosOriginales((prev) => prev.map(updateGasto))
      setGastosFiltrados((prev) => prev.map(updateGasto))

      triggerUpdate() // Notificar actualización global de gastos
    } catch (err: any) {
      console.error("Error al actualizar estado:", err)
      alert("Error al actualizar el estado del gasto")
    } finally {
      setUpdatingEstado(null)
    }
  }

  const handleEliminarGasto = async (gastoId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este gasto?")) {
      return
    }

    try {
      const { error } = await supabase.from("gastos_proyecto").delete().eq("id", gastoId)

      if (error) {
        throw error
      }
      // Remover de ambas listas
      setGastosOriginales((prev) => prev.filter((gasto) => gasto.id !== gastoId))
      setGastosFiltrados((prev) => prev.filter((gasto) => gasto.id !== gastoId))

      triggerUpdate() // Notificar actualización global de gastos
    } catch (err: any) {
      console.error("Error al eliminar gasto:", err)
      alert("Error al eliminar el gasto")
    }
  }

  const getTipoGastoLabel = (tipo: string) => {
    const tipos = {
      honorarios: "Honorarios",
      refrigerios: "Refrigerios",
      transporte: "Transporte",
      materiales: "Materiales",
      servicios: "Servicios",
      otros: "Otros",
    }
    return tipos[tipo as keyof typeof tipos] || tipo
  }

  const getTipoGastoColor = (tipo: string) => {
    const colores = {
      honorarios: "bg-blue-100 text-blue-800",
      refrigerios: "bg-green-100 text-green-800",
      transporte: "bg-yellow-100 text-yellow-800",
      materiales: "bg-purple-100 text-purple-800",
      servicios: "bg-orange-100 text-orange-800",
      otros: "bg-gray-100 text-gray-800",
    }
    return colores[tipo as keyof typeof colores] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        <span className="ml-2">Cargando gastos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-red-700">
          Error: {error}
          <Button onClick={fetchGastos} className="mt-2 ml-4 bg-red-600 hover:bg-red-700" size="sm">
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (proyectos.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No tienes proyectos</h3>
          <p className="text-gray-500 mb-6">Necesitas crear un proyecto antes de registrar gastos</p>
          <Link href="/dashboard/proyectos/crear">
            <Button className="bg-red-600 hover:bg-red-700">Crear Primer Proyecto</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (gastosFiltrados.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {gastosOriginales.length === 0 ? "No hay gastos" : "No se encontraron gastos"}
          </h3>
          <p className="text-gray-500 mb-6">
            {gastosOriginales.length === 0
              ? filtro === "pendientes"
                ? "No hay gastos pendientes de aprobación"
                : filtro === "aprobados"
                  ? "No hay gastos aprobados"
                  : "No hay gastos registrados en tus proyectos"
              : "No se encontraron gastos con los filtros aplicados"}
          </p>
          {gastosOriginales.length === 0 && (
            <Link href="/dashboard/gastos/nuevo">
              <Button className="bg-red-600 hover:bg-red-700">Registrar Primer Gasto</Button>
            </Link>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Contador de resultados */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>
          Mostrando {gastosFiltrados.length} de {gastosOriginales.length} gastos
        </span>
        <span>Total: {formatCOP(gastosFiltrados.reduce((sum, gasto) => sum + Number(gasto.monto), 0))}</span>
      </div>

      {gastosFiltrados.map((gasto) => (
        <Card key={gasto.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Badge className={getTipoGastoColor(gasto.tipo_gasto)}>{getTipoGastoLabel(gasto.tipo_gasto)}</Badge>
                  <Badge
                    variant={gasto.aprobado ? "default" : "secondary"}
                    className={gasto.aprobado ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                  >
                    {gasto.aprobado ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Aprobado
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        Pendiente
                      </>
                    )}
                  </Badge>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">{gasto.descripcion}</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{gasto.proyecto?.nombre || "Proyecto no encontrado"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(gasto.fecha_gasto).toLocaleDateString()}</span>
                  </div>
                  {gasto.responsable && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{gasto.responsable}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-semibold">{formatCOP(gasto.monto)}</span>
                  </div>
                </div>

                {gasto.observaciones && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">
                      <strong>Observaciones:</strong> {gasto.observaciones}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                <div className="text-right mr-4">
                  <p className="text-2xl font-bold text-gray-900">{formatCOP(gasto.monto)}</p>
                  <p className="text-sm text-gray-500">{new Date(gasto.created_at).toLocaleDateString()}</p>
                </div>

                {/* Control de Estado */}
                {updatingEstado === gasto.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Select
                    value={gasto.aprobado ? "aprobado" : "pendiente"}
                    onValueChange={(value) => handleEstadoChange(gasto.id, value === "aprobado")}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="aprobado">Aprobado</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {/* Menú de Acciones */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/proyectos/${gasto.proyecto_id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Proyecto
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/gastos/${gasto.id}/editar`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Gasto
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => handleEliminarGasto(gasto.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
