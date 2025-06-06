"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Loader2,
  Eye,
  Download,
  Trash2,
  Calendar,
  FileText,
  MoreHorizontal,
  AlertCircle,
  Image,
  Video,
  FileTextIcon,
  File,
  Search,
  Filter,
  AudioLines,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useEvidenciasUpdate } from "@/components/evidencias/evidencias-update-context"
import { ModalEliminarEvidencia } from "@/components/evidencias/modal-eliminar-evidencia"
import { ModalFuncionalidadNoDisponible } from "@/components/evidencias/modal-funcionalidad-no-disponible"
import type { EvidenciaProyecto, Proyecto } from "@/lib/types"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface EvidenciaConProyecto extends EvidenciaProyecto {
  proyecto?: Proyecto
}

interface ListaEvidenciasProps {
  filtro?: "todas" | "fotografias" | "videos" | "documentos" | "audios" | "otros"
  evidencias?: EvidenciaConProyecto[]
  proyectos?: Proyecto[]
  showFilters?: boolean
}

export function ListaEvidencias({ 
  filtro = "todas", 
  evidencias: evidenciasExternas, 
  proyectos: proyectosExternas, 
  showFilters = true 
}: ListaEvidenciasProps) {  const [evidenciasOriginales, setEvidenciasOriginales] = useState<EvidenciaConProyecto[]>([])
  const [evidenciasFiltradas, setEvidenciasFiltradas] = useState<EvidenciaConProyecto[]>([])
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const [filtroTipo, setFiltroTipo] = useState<string>("todas")
  const [filtroProyecto, setFiltroProyecto] = useState<string>("todos")
  const [filtroFecha, setFiltroFecha] = useState<string>("")
  // Estados para modales
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false)
  const [evidenciaAEliminar, setEvidenciaAEliminar] = useState<EvidenciaConProyecto | null>(null)
  const [eliminandoEvidencia, setEliminandoEvidencia] = useState(false)
  const [modalFuncionalidadAbierto, setModalFuncionalidadAbierto] = useState(false)
  const [tipoFuncionalidad, setTipoFuncionalidad] = useState<"ver" | "descargar">("ver")
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { lastUpdate, triggerUpdate } = useEvidenciasUpdate()

  // Si se proporcionan evidencias externas, usarlas en lugar de cargar desde la base de datos
  const usingExternalData = !!evidenciasExternas && !!proyectosExternas
  useEffect(() => {
    if (usingExternalData) {
      setEvidenciasOriginales(evidenciasExternas!)
      setEvidenciasFiltradas(evidenciasExternas!)
      setProyectos(proyectosExternas!)
      setLoading(false)
    } else if (user) {
      // Cargar evidencias tanto si showFilters es true como false
      fetchEvidencias()
    }
  }, [user, filtro, lastUpdate, evidenciasExternas, proyectosExternas, usingExternalData])
  // Aplicar filtros cuando cambien los filtros o las evidencias originales
  useEffect(() => {
    if (evidenciasOriginales.length > 0) {
      const evidenciasFiltradas = aplicarFiltros(evidenciasOriginales)
      setEvidenciasFiltradas(evidenciasFiltradas)
    } else {
      setEvidenciasFiltradas([])
    }
  }, [evidenciasOriginales, busqueda, filtroTipo, filtroProyecto, filtroFecha, filtro])

  const fetchEvidencias = async () => {
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
        setEvidenciasOriginales([])
        setEvidenciasFiltradas([])
        setProyectos([])
        setLoading(false)
        return
      }

      setProyectos(proyectosData)
      const proyectoIds = proyectosData.map((p) => p.id)

      // Construir query de evidencias
      let query = supabase.from("evidencias_proyecto").select("*").in("proyecto_id", proyectoIds)      // Aplicar filtro de tipo según la pestaña
      if (filtro === "fotografias") {
        query = query.eq("tipo_evidencia", "fotografia")
      } else if (filtro === "videos") {
        query = query.eq("tipo_evidencia", "video")
      } else if (filtro === "documentos") {
        query = query.in("tipo_evidencia", ["documento", "lista_asistencia", "informe"])
      } else if (filtro === "audios") {
        query = query.eq("tipo_evidencia", "audio")
      } else if (filtro === "otros") {
        query = query.eq("tipo_evidencia", "otro")
      }

      const { data: evidenciasData, error: evidenciasError } = await query.order("fecha_actividad", { ascending: false })

      if (evidenciasError) {
        throw evidenciasError
      }

      // Combinar evidencias con información del proyecto
      const evidenciasConProyecto =
        evidenciasData?.map((evidencia) => ({
          ...evidencia,
          proyecto: proyectosData.find((p) => p.id === evidencia.proyecto_id),
        })) || []

      setEvidenciasOriginales(evidenciasConProyecto)
    } catch (err: any) {
      setError(err.message || "Error al cargar las evidencias")
      console.error("Error al cargar evidencias:", err)
    } finally {
      setLoading(false)
    }
  }
  const aplicarFiltros = (evidencias: EvidenciaConProyecto[]) => {
    let filtradas = [...evidencias]

    // Filtro por búsqueda
    if (busqueda) {
      filtradas = filtradas.filter(
        (evidencia) =>
          evidencia.nombre_archivo.toLowerCase().includes(busqueda.toLowerCase()) ||
          evidencia.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
          evidencia.proyecto?.nombre.toLowerCase().includes(busqueda.toLowerCase())
      )
    }

    // Filtro por tipo (considerando tanto filtros internos como externos del dashboard)
    const tipoActivo = filtro !== "todas" ? filtro : filtroTipo
    
    if (tipoActivo !== "todas") {
      if (tipoActivo === "fotografias") {
        filtradas = filtradas.filter((e) => e.tipo_evidencia === "fotografia")
      } else if (tipoActivo === "videos") {
        filtradas = filtradas.filter((e) => e.tipo_evidencia === "video")
      } else if (tipoActivo === "documentos") {
        filtradas = filtradas.filter((e) => ["documento", "lista_asistencia", "informe"].includes(e.tipo_evidencia))
      } else if (tipoActivo === "audios") {
        filtradas = filtradas.filter((e) => e.tipo_evidencia === "audio")
      } else if (tipoActivo === "otros") {
        filtradas = filtradas.filter((e) => e.tipo_evidencia === "otro")
      } else {
        // Para filtros internos (valores directos de la DB)
        filtradas = filtradas.filter((e) => e.tipo_evidencia === tipoActivo)
      }
    }

    // Filtro por proyecto
    if (filtroProyecto !== "todos") {
      filtradas = filtradas.filter((e) => e.proyecto_id === filtroProyecto)
    }

    // Filtro por fecha
    if (filtroFecha) {
      filtradas = filtradas.filter((e) => e.fecha_actividad === filtroFecha)
    }

    return filtradas
  }
  const handleEliminarEvidencia = async (evidenciaId: string) => {
    setEliminandoEvidencia(true)
    
    try {
      const { error } = await supabase.from("evidencias_proyecto").delete().eq("id", evidenciaId)

      if (error) {
        throw error
      }
      
      // Remover de ambas listas
      setEvidenciasOriginales((prev) => prev.filter((evidencia) => evidencia.id !== evidenciaId))
      setEvidenciasFiltradas((prev) => prev.filter((evidencia) => evidencia.id !== evidenciaId))

      triggerUpdate() // Notificar actualización global de evidencias
      
      // Cerrar modal
      setModalEliminarAbierto(false)
      setEvidenciaAEliminar(null)
    } catch (err: any) {
      console.error("Error al eliminar evidencia:", err)
      alert("Error al eliminar la evidencia")
    } finally {
      setEliminandoEvidencia(false)
    }
  }

  const abrirModalEliminar = (evidencia: EvidenciaConProyecto) => {
    setEvidenciaAEliminar(evidencia)
    setModalEliminarAbierto(true)
  }

  const abrirModalFuncionalidad = (tipo: "ver" | "descargar") => {
    setTipoFuncionalidad(tipo)
    setModalFuncionalidadAbierto(true)
  }
  const getTipoEvidenciaLabel = (tipo: string) => {
    const tipos = {
      fotografia: "Fotografía",
      video: "Video",
      audio: "Audio",
      lista_asistencia: "Lista de Asistencia",
      informe: "Informe",
      documento: "Documento",
      otro: "Otro",
    }
    return tipos[tipo as keyof typeof tipos] || tipo
  }
  const getTipoEvidenciaIcon = (tipo: string) => {
    const iconos = {
      fotografia: <Image className="h-4 w-4" />,
      video: <Video className="h-4 w-4" />,
      audio: <AudioLines className="h-4 w-4" />,
      lista_asistencia: <FileTextIcon className="h-4 w-4" />,
      informe: <FileText className="h-4 w-4" />,
      documento: <File className="h-4 w-4" />,
      otro: <File className="h-4 w-4" />,
    }
    return iconos[tipo as keyof typeof iconos] || <File className="h-4 w-4" />
  }

  const getTipoEvidenciaColor = (tipo: string) => {
    const colores = {
      fotografia: "bg-purple-100 text-purple-800",
      video: "bg-blue-100 text-blue-800",
      audio: "bg-indigo-100 text-indigo-800",
      lista_asistencia: "bg-green-100 text-green-800",
      informe: "bg-yellow-100 text-yellow-800",
      documento: "bg-orange-100 text-orange-800",
      otro: "bg-gray-100 text-gray-800",
    }
    return colores[tipo as keyof typeof colores] || "bg-gray-100 text-gray-800"
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Tamaño desconocido"
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        <span className="ml-3 text-gray-600">Cargando evidencias...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-red-700">{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros de búsqueda */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Búsqueda */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar evidencias..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filtro por tipo */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tipo</label>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="fotografias">Fotografías</SelectItem>
                    <SelectItem value="videos">Videos</SelectItem>
                    <SelectItem value="audio">Audios</SelectItem>
                    <SelectItem value="documentos">Documentos</SelectItem>
                    <SelectItem value="lista_asistencia">Listas de Asistencia</SelectItem>
                    <SelectItem value="informe">Informes</SelectItem>
                    <SelectItem value="otro">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por proyecto */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Proyecto</label>
                <Select value={filtroProyecto} onValueChange={setFiltroProyecto}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los proyectos</SelectItem>
                    {proyectos.map((proyecto) => (
                      <SelectItem key={proyecto.id} value={proyecto.id}>
                        {proyecto.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por fecha */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Fecha</label>
                <Input
                  type="date"
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contador de resultados */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {evidenciasFiltradas.length} evidencia{evidenciasFiltradas.length !== 1 ? 's' : ''} encontrada{evidenciasFiltradas.length !== 1 ? 's' : ''}
        </p>
        
        {busqueda && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBusqueda("")
              setFiltroTipo("todas")
              setFiltroProyecto("todos")
              setFiltroFecha("")
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Lista de evidencias */}
      {evidenciasFiltradas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <Image className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay evidencias</h3>
            <p className="text-gray-600 mb-4">
              {busqueda || filtroTipo !== "todas" || filtroProyecto !== "todos" || filtroFecha
                ? "No se encontraron evidencias con los filtros aplicados."
                : "Aún no se han subido evidencias para los proyectos."}
            </p>
            <Link href="/dashboard/evidencias/nuevo">
              <Button className="bg-red-600 hover:bg-red-700">
                Subir Primera Evidencia
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {evidenciasFiltradas.map((evidencia) => (
            <Card key={evidencia.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Icono del tipo */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        {getTipoEvidenciaIcon(evidencia.tipo_evidencia)}
                      </div>
                    </div>

                    {/* Información principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {evidencia.nombre_archivo}
                        </h3>
                        <Badge className={getTipoEvidenciaColor(evidencia.tipo_evidencia)}>
                          {getTipoEvidenciaLabel(evidencia.tipo_evidencia)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>{evidencia.proyecto?.nombre || "Proyecto no encontrado"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(evidencia.fecha_actividad).toLocaleDateString('es-CO')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <File className="h-4 w-4" />
                          <span>{formatFileSize(evidencia.tamaño_archivo || undefined)}</span>
                        </div>
                      </div>

                      {evidencia.descripcion && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {evidencia.descripcion}
                        </p>
                      )}
                    </div>
                  </div>                  {/* Acciones */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => abrirModalFuncionalidad("ver")}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => abrirModalFuncionalidad("descargar")}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Descargar
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => abrirModalEliminar(evidencia)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}        </div>
      )}

      {/* Modales */}
      <ModalEliminarEvidencia
        isOpen={modalEliminarAbierto}
        onOpenChange={setModalEliminarAbierto}
        evidencia={evidenciaAEliminar}
        onConfirmarEliminacion={() => evidenciaAEliminar && handleEliminarEvidencia(evidenciaAEliminar.id)}
        isLoading={eliminandoEvidencia}
      />

      <ModalFuncionalidadNoDisponible
        isOpen={modalFuncionalidadAbierto}
        onOpenChange={setModalFuncionalidadAbierto}
        tipo={tipoFuncionalidad}
      />
    </div>
  )
}
