"use client"

import type React from "react"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import type { Proyecto } from "@/lib/types"
import { getEstadoBadge } from "@/components/proyectos/helpers"

interface EditarProyectoPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditarProyectoPage({ params }: EditarProyectoPageProps) {
  const resolvedParams = use(params)
  const proyectoId = resolvedParams.id
  const [proyecto, setProyecto] = useState<Proyecto | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    presupuesto_total: "",
    fecha_inicio: "",
    fecha_fin: "",
    estado: "planificacion",
    ministerio_aprobacion: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    fetchProyecto()
  }, [proyectoId, user, router])

  const fetchProyecto = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase.from("proyectos").select("*").eq("id", proyectoId).single()

      if (error) {
        throw error
      }

      // Verificar que el supervisor solo pueda editar sus proyectos
      if (user?.rol === "supervisor" && data.supervisor_id !== user.id) {
        throw new Error("No tienes permisos para editar este proyecto")
      }

      setProyecto(data)
      setFormData({
        nombre: data.nombre,
        descripcion: data.descripcion || "",
        presupuesto_total: data.presupuesto_total.toString(),
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin || "",
        estado: data.estado,
        ministerio_aprobacion: data.ministerio_aprobacion,
      })
    } catch (err: any) {
      setError(err.message || "Error al cargar el proyecto")
      console.error("Error al cargar proyecto:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      if (!formData.nombre || !formData.presupuesto_total || !formData.fecha_inicio) {
        throw new Error("Por favor complete todos los campos obligatorios")
      }

      const presupuesto = Number.parseFloat(formData.presupuesto_total)
      if (isNaN(presupuesto) || presupuesto <= 0) {
        throw new Error("El presupuesto debe ser un número válido mayor a cero")
      }

      const { error: updateError } = await supabase
        .from("proyectos")
        .update({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          presupuesto_total: presupuesto,
          fecha_inicio: formData.fecha_inicio,
          fecha_fin: formData.fecha_fin || null,
          estado: formData.estado,
          ministerio_aprobacion: formData.ministerio_aprobacion,
          updated_at: new Date().toISOString(),
        })
        .eq("id", proyectoId)

      if (updateError) {
        throw updateError
      }

      setSuccess(true)

      setTimeout(() => {
        router.push(`/dashboard/proyectos/${proyectoId}`)
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Error al actualizar el proyecto")
      console.error("Error al actualizar proyecto:", err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  if (error && !proyecto) {
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
            <p>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href={`/dashboard/proyectos/${proyectoId}`}>
            <Button variant="ghost" className="flex items-center gap-2 text-gray-600">
              <ArrowLeft className="h-4 w-4" />
              Volver al Proyecto
            </Button>
          </Link>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Editar Proyecto</CardTitle>
            <CardDescription>Modifica los datos del proyecto cultural</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <AlertDescription className="text-green-700">
                  ¡Proyecto actualizado exitosamente! Redirigiendo...
                </AlertDescription>
              </Alert>
            )}

            {/* Estado visual del proyecto, mejorado y alineado */}
            {proyecto && (
              <div className="flex items-center gap-2 mb-4">
                <span className="font-semibold text-gray-700">Estado actual:</span>
                {getEstadoBadge(proyecto.estado)}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Proyecto *</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Formación de Danza Pinta Sueños"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Breve descripción del proyecto..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="presupuesto_total">Presupuesto Total ($) *</Label>
                  <Input
                    id="presupuesto_total"
                    name="presupuesto_total"
                    type="number"
                    value={formData.presupuesto_total}
                    onChange={handleChange}
                    placeholder="Ej: 15000000"
                    min="0"
                    step="1000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select value={formData.estado} onValueChange={(value) => handleSelectChange("estado", value)}>
                    <SelectTrigger className="w-full bg-white border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-red-200">
                      <SelectValue placeholder="Seleccione un estado" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      <SelectItem value="planificacion">En Planificación</SelectItem>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="finalizado">Finalizado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_inicio">Fecha de Inicio *</Label>
                  <Input
                    id="fecha_inicio"
                    name="fecha_inicio"
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha_fin">Fecha de Finalización (opcional)</Label>
                  <Input
                    id="fecha_fin"
                    name="fecha_fin"
                    type="date"
                    value={formData.fecha_fin}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="ministerio_aprobacion"
                  name="ministerio_aprobacion"
                  checked={formData.ministerio_aprobacion}
                  onChange={handleChange}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="ministerio_aprobacion">Aprobación del Ministerio</Label>
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <Link href={`/dashboard/proyectos/${proyectoId}`}>
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </Link>
                <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
