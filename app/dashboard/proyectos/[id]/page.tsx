"use client"

import React, { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Loader2, FileText, Plus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { getEstadoBadge } from "@/components/proyectos/helpers"
import { ConfirmModal } from "@/components/proyectos/ConfirmModal"
import { formatCOP } from "@/lib/format-cop"
import type { Proyecto, GastoProyecto, EvidenciaProyecto } from "@/lib/types"

export default function ProyectoDetallePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const proyectoId = resolvedParams.id

  const [proyecto, setProyecto] = useState<Proyecto | null>(null)
  const [gastos, setGastos] = useState<GastoProyecto[]>([])
  const [evidencias, setEvidencias] = useState<EvidenciaProyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  // Nuevo estado para eliminar gasto
  const [gastoAEliminar, setGastoAEliminar] = useState<GastoProyecto | null>(null)
  const [deletingGasto, setDeletingGasto] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  // Mover fetchProyectoData fuera del useEffect para que esté en el scope global de la función
  const fetchProyectoData = async () => {
    try {
      setLoading(true)

      // Obtener proyecto
      const { data: proyectoData, error: proyectoError } = await supabase
        .from("proyectos")
        .select("*")
        .eq("id", proyectoId)
        .single()

      if (proyectoError) {
        throw proyectoError
      }

      setProyecto(proyectoData)

      // Obtener gastos del proyecto
      const { data: gastosData, error: gastosError } = await supabase
        .from("gastos_proyecto")
        .select("*")
        .eq("proyecto_id", proyectoId)
        .order("fecha_gasto", { ascending: false })

      if (!gastosError) {
        setGastos(gastosData || [])
      }

      // Obtener evidencias del proyecto
      const { data: evidenciasData, error: evidenciasError } = await supabase
        .from("evidencias_proyecto")
        .select("*")
        .eq("proyecto_id", proyectoId)
        .order("fecha_actividad", { ascending: false })

      if (!evidenciasError) {
        setEvidencias(evidenciasData || [])
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar el proyecto")
      console.error("Error al cargar proyecto:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    fetchProyectoData()
  }, [proyectoId, user, router])

  const totalGastos = gastos.reduce((sum, gasto) => sum + Number(gasto.monto), 0)
  // Si el proyecto no tiene presupuesto_ejecutado actualizado, mostrar el total de gastos como ejecutado
  const ejecutado = proyecto && typeof proyecto.presupuesto_ejecutado === 'number' ? proyecto.presupuesto_ejecutado : totalGastos

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchProyectoData()
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [user, router])

  const handleDeleteProyecto = async () => {
    setDeleting(true)
    setError(null)
    try {
      const { error: deleteError } = await supabase.from("proyectos").delete().eq("id", proyectoId)
      if (deleteError) throw deleteError
      setShowDeleteModal(false)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Error al eliminar el proyecto")
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteGasto = async () => {
    if (!gastoAEliminar) return
    setDeletingGasto(true)
    setError(null)
    try {
      const { error } = await supabase.from('gastos_proyecto').delete().eq('id', gastoAEliminar.id)
      if (error) throw error
      // Recalcular ejecutado tras eliminar
      const { data: gastosProyecto, error: errorGastos } = await supabase
        .from("gastos_proyecto")
        .select("monto")
        .eq("proyecto_id", proyectoId)
      if (!errorGastos && gastosProyecto) {
        const ejecutado = gastosProyecto.reduce((sum, g) => sum + Number(g.monto), 0)
        await supabase
          .from("proyectos")
          .update({ presupuesto_ejecutado: ejecutado })
          .eq("id", proyectoId)
      }
      setGastos(gastos.filter(g => g.id !== gastoAEliminar.id))
      setGastoAEliminar(null)
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el gasto')
    } finally {
      setDeletingGasto(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  if (error || !proyecto) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href="/dashboard">
              <Button variant="ghost" className="flex items-center gap-2 text-gray-600">
                <ArrowLeft className="h-4 w-4" />
                Volver al Dashboard
              </Button>
            </Link>
          </div>
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            <p>{error || "Proyecto no encontrado"}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" className="flex items-center gap-2 text-gray-600">
              <ArrowLeft className="h-4 w-4" />
              Volver al Dashboard
            </Button>
          </Link>
          <div className="flex gap-2">
            <Link href={`/dashboard/proyectos/${proyectoId}/editar`}>
              <Button variant="outline">Editar</Button>
            </Link>
            <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
              Eliminar
            </Button>
          </div>
        </div>

        {/* Header del proyecto */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{proyecto.nombre}</CardTitle>
                <CardDescription className="text-lg mt-2">{proyecto.descripcion}</CardDescription>
              </div>
              {getEstadoBadge(proyecto.estado)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="font-semibold">Presupuesto Total</p>
                <p className="text-2xl font-bold text-green-600">{formatCOP(proyecto.presupuesto_total)}</p>
              </div>
              <div>
                <p className="font-semibold">Gastos Ejecutados</p>
                <p className="text-2xl font-bold text-red-600">{formatCOP(ejecutado)}</p>
              </div>
              <div>
                <p className="font-semibold">Disponible</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCOP(proyecto.presupuesto_total - ejecutado)}
                </p>
              </div>
              <div>
                <p className="font-semibold">% Ejecutado</p>
                <p className="text-2xl font-bold">{Math.round((ejecutado / proyecto.presupuesto_total) * 100)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de contenido */}
        <Tabs defaultValue="gastos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gastos">Gastos</TabsTrigger>
            <TabsTrigger value="evidencias">Evidencias</TabsTrigger>
            <TabsTrigger value="informacion">Información</TabsTrigger>
          </TabsList>

          <TabsContent value="gastos" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Gastos del Proyecto</h2>
              <Link href={`/dashboard/gastos/nuevo?proyecto=${proyecto.id}`}>
                <Button className="bg-red-600 hover:bg-red-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Gasto
                </Button>
              </Link>
            </div>
            <div className="grid gap-4">
              {gastos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No hay gastos registrados para este proyecto</div>
              ) : (
                gastos.map((gasto) => (
                  <Card key={gasto.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={
                              gasto.tipo_gasto === 'honorarios' ? 'bg-blue-100 text-blue-800' :
                              gasto.tipo_gasto === 'refrigerios' ? 'bg-green-100 text-green-800' :
                              gasto.tipo_gasto === 'transporte' ? 'bg-yellow-100 text-yellow-800' :
                              gasto.tipo_gasto === 'materiales' ? 'bg-purple-100 text-purple-800' :
                              gasto.tipo_gasto === 'servicios' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {gasto.tipo_gasto.charAt(0).toUpperCase() + gasto.tipo_gasto.slice(1)}
                            </Badge>
                            <Badge
                              variant={gasto.aprobado ? "default" : "secondary"}
                              className={gasto.aprobado ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                            >
                              {gasto.aprobado ? "Aprobado" : "Pendiente"}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1">{gasto.descripcion}</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <span>Fecha:</span>
                              <span>{new Date(gasto.fecha_gasto).toLocaleDateString()}</span>
                            </div>
                            {gasto.responsable && (
                              <div className="flex items-center gap-2">
                                <span>Responsable:</span>
                                <span>{gasto.responsable}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span>Monto:</span>
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
                        <div className="text-right flex flex-col items-end gap-2">
                          <p className="text-xl font-bold">{formatCOP(gasto.monto)}</p>
                          <div className="flex gap-2">
                            <Link href={`/dashboard/gastos/${gasto.id}/editar`}>
                              <Button size="sm" variant="outline">Editar</Button>
                            </Link>
                            <Button size="sm" variant="destructive" onClick={() => setGastoAEliminar(gasto)}>
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            {/* Modal para eliminar gasto */}
            <ConfirmModal
              open={!!gastoAEliminar}
              title="¿Eliminar gasto?"
              description="Esta acción eliminará el gasto seleccionado. ¿Estás seguro de que deseas continuar?"
              confirmText="Sí, eliminar"
              cancelText="Cancelar"
              onConfirm={handleDeleteGasto}
              onCancel={() => setGastoAEliminar(null)}
              loading={deletingGasto}
            />
          </TabsContent>

          <TabsContent value="evidencias" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Evidencias del Proyecto</h2>
              <Link href={`/dashboard/evidencias/nuevo?proyecto=${proyecto.id}`}>
                <Button className="bg-red-600 hover:bg-red-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Subir Evidencia
                </Button>
              </Link>
            </div>
            <div className="grid gap-4">
              {evidencias.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No hay evidencias registradas para este proyecto</div>
              ) : (
                evidencias.map((evidencia) => (
                  <Card key={evidencia.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold">{evidencia.tipo_evidencia}</h3>
                          <p className="text-gray-600 mt-1">{evidencia.descripcion}</p>
                          <div className="flex gap-4 mt-2 text-sm text-gray-500">
                            <span>Fecha: {new Date(evidencia.fecha_actividad).toLocaleDateString()}</span>
                            <span>Archivo: {evidencia.nombre_archivo}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-1" />
                          Ver Archivo
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="informacion" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información del Proyecto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold">Fecha de Inicio</p>
                    <p>{new Date(proyecto.fecha_inicio).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Fecha de Fin</p>
                    <p>{proyecto.fecha_fin ? new Date(proyecto.fecha_fin).toLocaleDateString() : "No definida"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Estado</p>
                    <p>{proyecto.estado}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Aprobación Ministerio</p>
                    <p>{proyecto.ministerio_aprobacion ? "Sí" : "No"}</p>
                  </div>
                </div>
                <div>
                  <p className="font-semibold">Descripción</p>
                  <p className="text-gray-600">{proyecto.descripcion || "Sin descripción"}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <ConfirmModal
          open={showDeleteModal}
          title="¿Eliminar proyecto?"
          description="Esta acción eliminará el proyecto y todos sus datos asociados. ¿Estás seguro de que deseas continuar?"
          confirmText="Sí, eliminar"
          cancelText="Cancelar"
          onConfirm={handleDeleteProyecto}
          onCancel={() => setShowDeleteModal(false)}
          loading={deleting}
        />
      </div>
    </div>
  )
}
