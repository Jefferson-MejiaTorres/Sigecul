"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

export function FormularioProyecto() {
  // Calcular fechas por defecto UX-friendly
  const today = new Date()
  const defaultInicio = today.toISOString().slice(0, 10)
  const defaultFin = (() => {
    const fin = new Date(today)
    fin.setMonth(fin.getMonth() + 1)
    return fin.toISOString().slice(0, 10)
  })()

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    presupuesto_total: "",
    fecha_inicio: defaultInicio,
    fecha_fin: defaultFin,
    estado: "planificacion",
    ministerio_aprobacion: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const presupuestoInputRef = useRef<HTMLInputElement>(null)

  // Formatear valor a COP amigable
  const formatCOP = (value: string | number) => {
    if (!value) return ""
    const num = typeof value === "number" ? value : Number(value.replace(/[^\d]/g, ""))
    if (isNaN(num)) return ""
    return num.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
  }

  // Manejar cambio amigable en el input de presupuesto
  const handlePresupuestoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^\d]/g, "")
    if (raw.length > 12) raw = raw.slice(0, 12) // Limitar a 12 dígitos
    setFormData((prev) => ({ ...prev, presupuesto_total: raw }))
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
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Verificar que el usuario esté autenticado
      if (!user || !user.id) {
        throw new Error("Usuario no autenticado o sin ID válido")
      }

      // Validar datos
      if (!formData.nombre || !formData.presupuesto_total || !formData.fecha_inicio) {
        throw new Error("Por favor complete todos los campos obligatorios")
      }

      const presupuesto = Number.parseFloat(formData.presupuesto_total)
      if (isNaN(presupuesto) || presupuesto <= 0) {
        throw new Error("El presupuesto debe ser un número válido mayor a cero")
      }

      // Insertar proyecto en la base de datos
      const { data, error: supabaseError } = await supabase
        .from("proyectos")
        .insert([
          {
            nombre: formData.nombre,
            descripcion: formData.descripcion,
            presupuesto_total: presupuesto,
            fecha_inicio: formData.fecha_inicio,
            fecha_fin: formData.fecha_fin || null,
            estado: formData.estado,
            supervisor_id: user.id,
            ministerio_aprobacion: formData.ministerio_aprobacion,
          },
        ])
        .select()

      if (supabaseError) {
        throw supabaseError
      }

      setSuccess(true)
      setFormData({
        nombre: "",
        descripcion: "",
        presupuesto_total: "",
        fecha_inicio: defaultInicio,
        fecha_fin: defaultFin,
        estado: "planificacion",
        ministerio_aprobacion: false,
      })
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Error al crear el proyecto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Crear Nuevo Proyecto</CardTitle>
        <CardDescription>
          Complete los datos para registrar un nuevo proyecto cultural.
        </CardDescription>
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
              ¡Proyecto creado exitosamente! Redirigiendo...
            </AlertDescription>
          </Alert>
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
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="presupuesto_total">Presupuesto Total (COP) *</Label>
              <Input
                id="presupuesto_total"
                name="presupuesto_total"
                type="text"
                inputMode="numeric"
                ref={presupuestoInputRef}
                value={formatCOP(formData.presupuesto_total)}
                onChange={handlePresupuestoChange}
                placeholder="$ 15.000.000"
                minLength={4}
                maxLength={15}
                required
                autoComplete="off"
                onFocus={(e) => e.target.select()}
              />
              <span className="text-xs text-gray-500">Ejemplo: $ 15.000.000</span>
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
                className="appearance-none px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-red-200"
                min={defaultInicio}
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
                className="appearance-none px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-red-200"
                min={formData.fecha_inicio}
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
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Proyecto"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
