"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  Phone, 
  Mail, 
  Briefcase, 
  DollarSign,
  Loader2,
  AlertCircle,
  UserCheck,
  UserX
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { usePagosUpdate } from "./pagos-update-context"
import { FormularioTrabajador } from "./formulario-trabajador"
import { ModalValidacionTrabajador } from "./modal-validacion-trabajador"
import { formatCOP } from "@/lib/format-cop"
import type { Trabajador, PagoPersonal } from "@/lib/types"

export function ListaTrabajadores() {
  const { user } = useAuth()
  const { lastUpdate } = usePagosUpdate()
  
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([])
  const [trabajadoresFiltrados, setTrabajadoresFiltrados] = useState<Trabajador[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [trabajadorEditar, setTrabajadorEditar] = useState<Trabajador | undefined>()
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "activos" | "inactivos">("activos")
  
  // Estados para el modal de validación
  const [modalValidacion, setModalValidacion] = useState({
    isOpen: false,
    trabajador: null as Trabajador | null,
    pagosAsociados: [] as PagoPersonal[],
    accion: "desactivar" as "desactivar" | "eliminar"
  })

  useEffect(() => {
    if (user) {
      fetchTrabajadores()
    }
  }, [user, lastUpdate])

  useEffect(() => {
    aplicarFiltros()
  }, [trabajadores, busqueda, filtroEstado])

  const fetchTrabajadores = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("trabajadores")
        .select("*")
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      setTrabajadores(data || [])
    } catch (err: any) {
      console.error("Error fetching trabajadores:", err)
      setError(err.message || "Error al cargar los trabajadores")
    } finally {
      setLoading(false)
    }
  }

  const aplicarFiltros = () => {
    let filtrados = [...trabajadores]

    // Filtro por estado
    if (filtroEstado === "activos") {
      filtrados = filtrados.filter(t => t.activo)
    } else if (filtroEstado === "inactivos") {
      filtrados = filtrados.filter(t => !t.activo)
    }

    // Filtro por búsqueda
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase().trim()
      filtrados = filtrados.filter(trabajador =>
        trabajador.nombre.toLowerCase().includes(termino) ||
        trabajador.cedula.includes(termino) ||
        trabajador.especialidad?.toLowerCase().includes(termino) ||
        trabajador.email?.toLowerCase().includes(termino)
      )
    }

    setTrabajadoresFiltrados(filtrados)
  }

  const handleEditarTrabajador = (trabajador: Trabajador) => {
    setTrabajadorEditar(trabajador)
    setMostrarFormulario(true)
  }

  // Función para verificar si un trabajador tiene pagos
  const verificarPagosAsociados = async (trabajadorId: string): Promise<PagoPersonal[]> => {
    try {
      const { data, error } = await supabase
        .from("pagos_personal")
        .select("*")
        .eq("trabajador_id", trabajadorId)

      if (error) throw error
      return data || []
    } catch (err) {
      console.error("Error verificando pagos:", err)
      return []
    }
  }

  const handleDesactivarTrabajador = async (trabajador: Trabajador) => {
    if (trabajador.activo) {
      // Si se intenta desactivar, verificar pagos asociados
      const pagosAsociados = await verificarPagosAsociados(trabajador.id)
      
      setModalValidacion({
        isOpen: true,
        trabajador,
        pagosAsociados,
        accion: "desactivar"
      })
    } else {
      // Si se intenta activar, no necesita validación
      await confirmarDesactivacion(trabajador.id, true)
    }
  }

  const confirmarDesactivacion = async (trabajadorId: string, activar: boolean = false) => {
    try {
      const { error } = await supabase
        .from("trabajadores")
        .update({ activo: activar })
        .eq("id", trabajadorId)

      if (error) throw error

      await fetchTrabajadores()
    } catch (err: any) {
      console.error("Error updating trabajador:", err)
      setError(err.message || "Error al actualizar el trabajador")
    }
  }

  const handleFormularioSuccess = () => {
    setMostrarFormulario(false)
    setTrabajadorEditar(undefined)
    fetchTrabajadores()
  }

  const handleFormularioCancel = () => {
    setMostrarFormulario(false)
    setTrabajadorEditar(undefined)
  }

  const cerrarModalValidacion = () => {
    setModalValidacion({
      isOpen: false,
      trabajador: null,
      pagosAsociados: [],
      accion: "desactivar"
    })
  }

  if (mostrarFormulario) {
    return (
      <FormularioTrabajador
        trabajador={trabajadorEditar}
        onSuccess={handleFormularioSuccess}
        onCancel={handleFormularioCancel}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Modal de validación */}
      <ModalValidacionTrabajador
        isOpen={modalValidacion.isOpen}
        onOpenChange={cerrarModalValidacion}
        trabajadorNombre={modalValidacion.trabajador?.nombre || ""}
        pagosAsociados={modalValidacion.pagosAsociados}
        accion={modalValidacion.accion}
        onConfirmarDesactivacion={() => modalValidacion.trabajador && confirmarDesactivacion(modalValidacion.trabajador.id, false)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Trabajadores</h2>
          <p className="text-gray-600">Personal temporal de la Corporación Cultural</p>
        </div>
        <Button 
          onClick={() => setMostrarFormulario(true)}
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Registrar Trabajador
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, cédula, especialidad o email..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por estado */}
            <div className="flex gap-2">
              <Button
                variant={filtroEstado === "activos" ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroEstado("activos")}
                className={filtroEstado === "activos" ? "bg-red-600 hover:bg-red-700" : ""}
              >
                <UserCheck className="h-4 w-4 mr-1" />
                Activos
              </Button>
              <Button
                variant={filtroEstado === "inactivos" ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroEstado("inactivos")}
                className={filtroEstado === "inactivos" ? "bg-red-600 hover:bg-red-700" : ""}
              >
                <UserX className="h-4 w-4 mr-1" />
                Inactivos
              </Button>
              <Button
                variant={filtroEstado === "todos" ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroEstado("todos")}
                className={filtroEstado === "todos" ? "bg-red-600 hover:bg-red-700" : ""}
              >
                <User className="h-4 w-4 mr-1" />
                Todos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mensaje de error */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de trabajadores */}
      {trabajadoresFiltrados.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {trabajadores.length === 0 ? "No hay trabajadores registrados" : "No se encontraron trabajadores"}
            </h3>
            <p className="text-gray-600 mb-6">
              {trabajadores.length === 0 
                ? "Comienza registrando el primer trabajador de la corporación"
                : "Intenta ajustar los filtros de búsqueda"
              }
            </p>
            {trabajadores.length === 0 && (
              <Button 
                onClick={() => setMostrarFormulario(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Registrar Primer Trabajador
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {trabajadoresFiltrados.map((trabajador) => (
            <Card key={trabajador.id} className={`transition-all hover:shadow-md ${!trabajador.activo ? "opacity-60 border-gray-300" : ""}`}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <User className="h-5 w-5 text-red-600" />
                          {trabajador.nombre}
                          {!trabajador.activo && (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                              Inactivo
                            </Badge>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">Cédula: {trabajador.cedula}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      {trabajador.telefono && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="h-4 w-4" />
                          {trabajador.telefono}
                        </div>
                      )}
                      
                      {trabajador.email && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="h-4 w-4" />
                          {trabajador.email}
                        </div>
                      )}
                      
                      {trabajador.especialidad && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Briefcase className="h-4 w-4" />
                          {trabajador.especialidad}
                        </div>
                      )}
                      
                      {trabajador.valor_hora && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="h-4 w-4" />
                          {formatCOP(trabajador.valor_hora)}/hora
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditarTrabajador(trabajador)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDesactivarTrabajador(trabajador)}
                      className={trabajador.activo ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                    >
                      {trabajador.activo ? (
                        <>
                          <UserX className="h-4 w-4 mr-1" />
                          Desactivar
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-1" />
                          Activar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
