"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import {
  Loader2,
  Plus,
  Eye,
  DollarSign,
  Camera,
  Edit,
  Clock,
  FolderOpen,
  CheckCircle,
  XCircle,
  Calendar,
  Target,
} from "lucide-react"
import type { Proyecto } from "@/lib/types"
import { getEstadoBadge, getEstadoColor, calcularProgreso, calcularDiasTranscurridos } from "@/components/proyectos/helpers"
import { formatCOP } from "@/lib/format-cop"

export function ListaProyectos({ onRefreshDashboard }: { onRefreshDashboard?: () => void }) {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingEstado, setUpdatingEstado] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchProyectos()
      // Refrescar automáticamente al volver a la pestaña
      const handleVisibility = () => {
        if (document.visibilityState === "visible") {
          fetchProyectos()
        }
      }
      document.addEventListener("visibilitychange", handleVisibility)
      return () => {
        document.removeEventListener("visibilitychange", handleVisibility)
      }
    }
  }, [user])

  const fetchProyectos = async () => {
    try {
      setLoading(true)

      let query = supabase.from("proyectos").select("*")

      // Si el usuario es supervisor, solo mostrar sus proyectos
      if (user?.rol === "supervisor") {
        query = query.eq("supervisor_id", user.id)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) {
        console.error("Error en consulta de proyectos:", error)
        throw error
      }

      console.log("Proyectos cargados:", data)
      setProyectos(data as Proyecto[])
      // Si se pasa la prop, refrescar dashboard general también
      if (onRefreshDashboard) onRefreshDashboard()
    } catch (err: any) {
      setError(err.message || "Error al cargar los proyectos")
      console.error("Error al cargar proyectos:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleEstadoChange = async (proyectoId: string, nuevoEstado: string) => {
    try {
      setUpdatingEstado(proyectoId)

      const { error } = await supabase
        .from("proyectos")
        .update({
          estado: nuevoEstado,
          updated_at: new Date().toISOString(),
        })
        .eq("id", proyectoId)

      if (error) {
        throw error
      }

      // Refrescar la lista desde la base de datos para evitar inconsistencias
      await fetchProyectos()

      console.log(`Proyecto ${proyectoId} actualizado a estado: ${nuevoEstado}`)
    } catch (err: any) {
      console.error("Error al actualizar estado:", err)
      alert("Error al actualizar el estado del proyecto")
    } finally {
      setUpdatingEstado(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        <span className="ml-2">Cargando proyectos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
        <p>Error: {error}</p>
        <Button onClick={fetchProyectos} className="mt-2 bg-red-600 hover:bg-red-700">
          Reintentar
        </Button>
      </div>
    )
  }

  if (proyectos.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay proyectos</h3>
          <p className="text-gray-500 mb-6">Comienza creando tu primer proyecto cultural</p>
          <Link href="/dashboard/proyectos/crear">
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Crear Primer Proyecto
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      {/* El botón de actualizar ya está en el dashboard, así que lo quitamos aquí */}
      <div className="grid gap-6">
        {proyectos.map((proyecto) => {
          const progreso = calcularProgreso({ ...proyecto, presupuesto_ejecutado: proyecto.presupuesto_ejecutado ?? 0 })
          const diasTranscurridos = calcularDiasTranscurridos(proyecto.fecha_inicio)

          return (
            <Card
              key={proyecto.id}
              className={`border-l-4 ${getEstadoColor(proyecto.estado)} hover:shadow-lg transition-shadow`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{proyecto.nombre}</CardTitle>
                      {getEstadoBadge(proyecto.estado)}
                    </div>
                    <CardDescription className="text-base">{proyecto.descripcion}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {updatingEstado === proyecto.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Select value={proyecto.estado} onValueChange={(value) => handleEstadoChange(proyecto.id, value)}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planificacion">En Planificación</SelectItem>
                          <SelectItem value="activo">Activo</SelectItem>
                          <SelectItem value="finalizado">Finalizado</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Información del proyecto */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-semibold">Presupuesto</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCOP(proyecto.presupuesto_total)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-semibold">Ejecutado</p>
                      <p className="text-lg font-bold text-orange-600">
                        {formatCOP(proyecto.presupuesto_ejecutado ?? 0)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-semibold">Inicio</p>
                      <p className="text-sm text-gray-600">{new Date(proyecto.fecha_inicio).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500">{diasTranscurridos} días transcurridos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-full">
                      <p className="text-sm font-semibold mb-1">Progreso</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progreso}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{progreso}% completado</p>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 flex-wrap">
                  <Link href={`/dashboard/proyectos/${proyecto.id}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalles
                    </Button>
                  </Link>
                  <Link href={`/dashboard/proyectos/${proyecto.id}/editar`}>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </Link>
                  <Link href={`/dashboard/gastos/nuevo?proyecto=${proyecto.id}`}>
                    <Button size="sm" variant="outline">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Registrar Gasto
                    </Button>
                  </Link>
                  <Link href={`/dashboard/evidencias/nuevo?proyecto=${proyecto.id}`}>
                    <Button size="sm" variant="outline">
                      <Camera className="h-4 w-4 mr-1" />
                      Subir Evidencia
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
