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
  Users,
  Briefcase,
  XCircle,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { usePagosUpdate } from "@/components/pagos/pagos-update-context"
import type { PagoPersonal, Proyecto, Trabajador } from "@/lib/types"
import Link from "next/link"
import { formatCOP } from "@/lib/format-cop"
import FiltrosPagos from "@/components/pagos/filtros-pagos"
import { ModalEliminarPago } from "@/components/pagos/modal-eliminar-pago"

interface PagoConDetalles extends PagoPersonal {
  proyecto?: Proyecto
  trabajador?: Trabajador
}

interface ListaPagosProps {
  filtro?: "todos" | "pendientes" | "pagados" | "cancelados"
  pagos?: PagoConDetalles[]
  proyectos?: Proyecto[]
  showFilters?: boolean
}

function ListaPagos({ filtro = "todos", pagos: pagosExternos, proyectos: proyectosExternos, showFilters = true }: ListaPagosProps) {
  const [pagosOriginales, setPagosOriginales] = useState<PagoConDetalles[]>([])
  const [pagosFiltrados, setPagosFiltrados] = useState<PagoConDetalles[]>([])
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingEstado, setUpdatingEstado] = useState<string | null>(null)
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false)
  const [pagoAEliminar, setPagoAEliminar] = useState<PagoConDetalles | null>(null)
  const [eliminandoPago, setEliminandoPago] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const { lastUpdate, triggerUpdate } = usePagosUpdate()

  // Si se proporcionan pagos externos, usarlos en lugar de cargar desde la base de datos
  const usingExternalData = !!pagosExternos && !!proyectosExternos

  useEffect(() => {
    if (!authLoading && user) {
      if (usingExternalData) {
        setPagosOriginales(pagosExternos)
        setProyectos(proyectosExternos)
        aplicarFiltroInicial(pagosExternos)
        setLoading(false)
      } else {
        fetchPagos()
      }
    }
  }, [user, authLoading, lastUpdate, filtro, usingExternalData])

  const fetchPagos = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Obtener proyectos del usuario
      let queryProyectos = supabase.from("proyectos").select("*")
      if (user.rol === "supervisor") {
        queryProyectos = queryProyectos.eq("supervisor_id", user.id)
      }

      const { data: proyectosData, error: errorProyectos } = await queryProyectos.order("nombre")

      if (errorProyectos) throw errorProyectos

      if (!proyectosData || proyectosData.length === 0) {
        setPagosOriginales([])
        setPagosFiltrados([])
        setProyectos([])
        setLoading(false)
        return
      }

      setProyectos(proyectosData)
      const proyectoIds = proyectosData.map(p => p.id)

      // Obtener trabajadores
      const { data: trabajadoresData, error: errorTrabajadores } = await supabase
        .from("trabajadores")
        .select("*")
        .order("nombre")

      if (errorTrabajadores) throw errorTrabajadores
      setTrabajadores(trabajadoresData || [])

      // Obtener pagos con detalles
      const { data: pagosData, error: errorPagos } = await supabase
        .from("pagos_personal")
        .select(`
          *,
          proyectos(id, nombre),
          trabajadores(id, nombre, cedula, especialidad, valor_hora)
        `)
        .in("proyecto_id", proyectoIds)
        .order("fecha_actividad", { ascending: false })

      if (errorPagos) throw errorPagos

      const pagosConDetalles = (pagosData || []).map(pago => ({
        ...pago,
        proyecto: Array.isArray(pago.proyectos) ? pago.proyectos[0] : pago.proyectos,
        trabajador: Array.isArray(pago.trabajadores) ? pago.trabajadores[0] : pago.trabajadores,
      }))

      setPagosOriginales(pagosConDetalles)
      aplicarFiltroInicial(pagosConDetalles)
    } catch (err: any) {
      setError(err.message || "Error al cargar pagos")
      console.error("Error al cargar pagos:", err)
    } finally {
      setLoading(false)
    }
  }
  const aplicarFiltroInicial = (pagos: PagoConDetalles[]) => {
    let filtered = [...pagos]

    switch (filtro) {
      case "pendientes":
        filtered = pagos.filter(p => p.estado_pago === "pendiente")
        break
      case "pagados":
        filtered = pagos.filter(p => p.estado_pago === "pagado")
        break
      case "cancelados":
        filtered = pagos.filter(p => p.estado_pago === "cancelado")
        break
      default:
        break
    }

    setPagosFiltrados(filtered)
  }

  // Nueva función para manejar filtros avanzados preservando el filtro general
  const handleFiltrosAvanzados = (pagosFromFiltros: PagoConDetalles[]) => {
    // Si no hay filtro general (todos), usar directamente los pagos filtrados
    if (filtro === "todos") {
      setPagosFiltrados(pagosFromFiltros)
      return
    }

    // Si hay filtro general, aplicarlo a los pagos ya filtrados por filtros avanzados
    let filtered = [...pagosFromFiltros]
    
    switch (filtro) {
      case "pendientes":
        filtered = pagosFromFiltros.filter(p => p.estado_pago === "pendiente")
        break
      case "pagados":
        filtered = pagosFromFiltros.filter(p => p.estado_pago === "pagado")
        break
      case "cancelados":
        filtered = pagosFromFiltros.filter(p => p.estado_pago === "cancelado")
        break
      default:
        break
    }

    setPagosFiltrados(filtered)
  }

  const handleEstadoChange = async (pagoId: string, nuevoEstado: string) => {
    try {
      setUpdatingEstado(pagoId)

      const { error } = await supabase
        .from("pagos_personal")
        .update({ 
          estado_pago: nuevoEstado,
          fecha_pago: nuevoEstado === "pagado" ? new Date().toISOString().split('T')[0] : null
        })
        .eq("id", pagoId)

      if (error) throw error

      triggerUpdate()
    } catch (err: any) {
      setError(err.message || "Error al actualizar estado del pago")
      console.error("Error al actualizar estado:", err)
    } finally {
      setUpdatingEstado(null)
    }
  }
  const handleEliminarPago = (pago: PagoConDetalles) => {
    setPagoAEliminar(pago)
    setModalEliminarOpen(true)
  }

  const confirmarEliminacionPago = async () => {
    if (!pagoAEliminar) return

    setEliminandoPago(true)
    try {
      const { error } = await supabase
        .from("pagos_personal")
        .delete()
        .eq("id", pagoAEliminar.id)

      if (error) throw error

      triggerUpdate()
      setModalEliminarOpen(false)
      setPagoAEliminar(null)
    } catch (err: any) {
      setError(err.message || "Error al eliminar el pago")
      console.error("Error al eliminar pago:", err)
    } finally {
      setEliminandoPago(false)
    }
  }

  const getEstadoColor = (estado: string | null) => {
    switch (estado) {
      case "pagado":
        return "bg-green-100 text-green-800"
      case "pendiente":
        return "bg-yellow-100 text-yellow-800"
      case "cancelado":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTipoLaborLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      "docencia": "Docencia",
      "coordinacion": "Coordinación",
      "produccion": "Producción",
      "logistica": "Logística",
      "tecnico": "Técnico",
      "artistico": "Artístico",
      "otros": "Otros"
    }
    return tipos[tipo] || tipo
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        <span className="ml-2">Cargando pagos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-red-700">
          Error: {error}
          <Button onClick={fetchPagos} className="mt-2 ml-4 bg-red-600 hover:bg-red-700" size="sm">
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
          <p className="text-gray-500 mb-6">Necesitas crear un proyecto antes de registrar pagos</p>
          <Link href="/dashboard/proyectos/crear">
            <Button className="bg-red-600 hover:bg-red-700">Crear Primer Proyecto</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }
  // Renderizar siempre los filtros + contenido
  const renderContent = () => {
    if (pagosFiltrados.length === 0) {
      return (
        <Card className="text-center py-12">
          <CardContent>
            <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {pagosOriginales.length === 0 ? "No hay pagos registrados" : "No se encontraron pagos con los filtros aplicados"}
            </h3>
            <p className="text-gray-500 mb-6">
              {pagosOriginales.length === 0 
                ? "Comienza registrando el primer pago de tus proyectos"
                : "Intenta ajustar los filtros para ver más resultados"
              }
            </p>
            {pagosOriginales.length === 0 && (
              <Link href="/dashboard/pagos/nuevo-pago">
                <Button className="bg-red-600 hover:bg-red-700">Registrar Primer Pago</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )
    }

    return (
      <>
        {/* Contador de resultados */}
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>
            Mostrando {pagosFiltrados.length} de {pagosOriginales.length} pagos
          </span>
          <span>Total: {formatCOP(pagosFiltrados.reduce((sum, pago) => sum + Number(pago.valor_pactado), 0))}</span>
        </div>

        {pagosFiltrados.map((pago) => (
          <Card key={pago.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge className="bg-blue-100 text-blue-800">
                      {getTipoLaborLabel(pago.tipo_labor)}
                    </Badge>
                    <Badge
                      variant={pago.estado_pago === "pagado" ? "default" : "secondary"}
                      className={getEstadoColor(pago.estado_pago)}
                    >
                      {pago.estado_pago === "pagado" ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Pagado
                        </>
                      ) : pago.estado_pago === "cancelado" ? (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Cancelado
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Pendiente
                        </>
                      )}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {pago.trabajador?.nombre || "Trabajador no encontrado"}
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{pago.proyecto?.nombre || "Proyecto no encontrado"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(pago.fecha_actividad).toLocaleDateString()}</span>
                    </div>
                    {pago.horas_trabajadas && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{pago.horas_trabajadas}h trabajadas</span>
                      </div>
                    )}
                    {pago.trabajador?.especialidad && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        <span>{pago.trabajador.especialidad}</span>
                      </div>
                    )}
                  </div>

                  {pago.observaciones && (
                    <p className="text-sm text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                      {pago.observaciones}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{formatCOP(pago.valor_pactado)}</p>
                    <p className="text-sm text-gray-500">{new Date(pago.created_at).toLocaleDateString()}</p>
                  </div>

                  {/* Control de Estado */}
                  {updatingEstado === pago.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Select
                      value={pago.estado_pago || "pendiente"}
                      onValueChange={(value) => handleEstadoChange(pago.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="pagado">Pagado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
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
                        <Link href={`/dashboard/proyectos/${pago.proyecto_id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Proyecto
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/pagos/${pago.id}/editar`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar Pago
                        </Link>
                      </DropdownMenuItem>                      <DropdownMenuItem className="text-red-600" onClick={() => handleEliminarPago(pago)}>
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
      </>
    )
  }
  return (
    <div className="space-y-4">      {/* Filtros - siempre visibles cuando hay datos originales */}
      {showFilters && pagosOriginales.length > 0 && (
        <FiltrosPagos 
          pagos={pagosOriginales} 
          proyectos={proyectos}
          trabajadores={trabajadores}
          onFiltrarPagos={handleFiltrosAvanzados}
        />
      )}      {/* Contenido principal */}
      {renderContent()}

      {/* Modal de eliminación */}
      <ModalEliminarPago
        isOpen={modalEliminarOpen}
        onOpenChange={setModalEliminarOpen}
        pago={pagoAEliminar}
        onConfirmarEliminacion={confirmarEliminacionPago}
        isLoading={eliminandoPago}
      />
    </div>
  )
}

export { ListaPagos }
export default ListaPagos
