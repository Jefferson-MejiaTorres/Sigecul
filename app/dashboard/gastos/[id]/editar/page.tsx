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
import type { GastoProyecto, Proyecto } from "@/lib/types"
import { useGastosUpdate } from "@/components/gastos/gastos-update-context"

interface EditarGastoPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditarGastoPage({ params }: EditarGastoPageProps) {
  const resolvedParams = use(params)
  const gastoId = resolvedParams.id
  const [gasto, setGasto] = useState<GastoProyecto | null>(null)
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [formData, setFormData] = useState({
    proyecto_id: "",
    tipo_gasto: "",
    descripcion: "",
    monto: "",
    fecha_gasto: "",
    responsable: "",
    observaciones: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const { triggerUpdate } = useGastosUpdate()

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    fetchGastoYProyectos()
  }, [gastoId, user, router])

  const fetchGastoYProyectos = async () => {
    try {
      setLoading(true)

      // Verificar que el usuario esté autenticado
      if (!user) {
        router.push("/login")
        return
      }

      // Obtener el gasto
      const { data: gastoData, error: gastoError } = await supabase
        .from("gastos_proyecto")
        .select("*")
        .eq("id", gastoId)
        .single()

      if (gastoError) {
        throw gastoError
      }

      // Obtener proyectos del supervisor
      const { data: proyectosData, error: proyectosError } = await supabase
        .from("proyectos")
        .select("*")
        .eq("supervisor_id", user.id)
        .order("nombre")

      if (proyectosError) {
        throw proyectosError
      }

      // Verificar que el gasto pertenece a un proyecto del supervisor
      const proyectoDelGasto = proyectosData.find((p) => p.id === gastoData.proyecto_id)
      if (!proyectoDelGasto) {
        throw new Error("No tienes permisos para editar este gasto")
      }

      setGasto(gastoData)
      setProyectos(proyectosData)
      setFormData({
        proyecto_id: gastoData.proyecto_id || "",
        tipo_gasto: gastoData.tipo_gasto,
        descripcion: gastoData.descripcion,
        monto: gastoData.monto.toString(),
        fecha_gasto: gastoData.fecha_gasto,
        responsable: gastoData.responsable || "",
        observaciones: gastoData.observaciones || "",
      })
    } catch (err: any) {
      setError(err.message || "Error al cargar el gasto")
      console.error("Error al cargar gasto:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
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
      if (
        !formData.proyecto_id ||
        !formData.tipo_gasto ||
        !formData.descripcion ||
        !formData.monto ||
        !formData.fecha_gasto
      ) {
        throw new Error("Por favor complete todos los campos obligatorios")
      }

      const monto = Number.parseFloat(formData.monto)
      if (isNaN(monto) || monto <= 0) {
        throw new Error("El monto debe ser un número válido mayor a cero")
      }

      const { error: updateError } = await supabase
        .from("gastos_proyecto")
        .update({
          proyecto_id: formData.proyecto_id,
          tipo_gasto: formData.tipo_gasto as any,
          descripcion: formData.descripcion,
          monto,
          fecha_gasto: formData.fecha_gasto,
          responsable: formData.responsable || null,
          observaciones: formData.observaciones || null,
        })
        .eq("id", gastoId)

      if (updateError) {
        throw updateError
      }

      setSuccess(true)

      // Recalcular y actualizar el ejecutado del proyecto
      const { data: gastosProyecto, error: errorGastos } = await supabase
        .from("gastos_proyecto")
        .select("monto")
        .eq("proyecto_id", formData.proyecto_id)

      if (!errorGastos && gastosProyecto) {
        const ejecutado = gastosProyecto.reduce((sum, g) => sum + Number(g.monto), 0)
        await supabase
          .from("proyectos")
          .update({ presupuesto_ejecutado: ejecutado })
          .eq("id", formData.proyecto_id)
      }

      triggerUpdate() // Notificar actualización global de gastos

      setTimeout(() => {
        router.push("/dashboard/gastos")
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Error al actualizar el gasto")
      console.error("Error al actualizar gasto:", err)
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

  if (error && !gasto) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href="/dashboard/gastos">
              <Button variant="ghost" className="flex items-center gap-2 text-gray-600">
                <ArrowLeft className="h-4 w-4" />
                Volver a Gastos
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
          <Link href="/dashboard/gastos">
            <Button variant="ghost" className="flex items-center gap-2 text-gray-600">
              <ArrowLeft className="h-4 w-4" />
              Volver a Gastos
            </Button>
          </Link>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Editar Gasto</CardTitle>
            <CardDescription>Modifica los datos del gasto registrado</CardDescription>
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
                  ¡Gasto actualizado exitosamente! Redirigiendo...
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="proyecto_id">Proyecto *</Label>
                <Select
                  value={formData.proyecto_id}
                  onValueChange={(value) => handleSelectChange("proyecto_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {proyectos.map((proyecto) => (
                      <SelectItem key={proyecto.id} value={proyecto.id}>
                        {proyecto.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_gasto">Tipo de Gasto *</Label>
                  <Select
                    value={formData.tipo_gasto}
                    onValueChange={(value) => handleSelectChange("tipo_gasto", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="honorarios">Honorarios</SelectItem>
                      <SelectItem value="refrigerios">Refrigerios</SelectItem>
                      <SelectItem value="transporte">Transporte</SelectItem>
                      <SelectItem value="materiales">Materiales</SelectItem>
                      <SelectItem value="servicios">Servicios</SelectItem>
                      <SelectItem value="otros">Otros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monto">Monto ($) *</Label>
                  <Input
                    id="monto"
                    name="monto"
                    type="number"
                    value={formData.monto}
                    onChange={handleChange}
                    placeholder="Ej: 50000"
                    min="0"
                    step="1000"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción *</Label>
                <Textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Describa detalladamente el gasto..."
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_gasto">Fecha del Gasto *</Label>
                  <Input
                    id="fecha_gasto"
                    name="fecha_gasto"
                    type="date"
                    value={formData.fecha_gasto}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsable">Responsable</Label>
                  <Input
                    id="responsable"
                    name="responsable"
                    value={formData.responsable}
                    onChange={handleChange}
                    placeholder="Nombre del responsable"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleChange}
                  placeholder="Observaciones adicionales..."
                  rows={2}
                />
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <Link href="/dashboard/gastos">
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
