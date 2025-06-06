"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { Paperclip } from "lucide-react"
import type { Proyecto } from "@/lib/types"
import { formatCOP } from "@/lib/format-cop"
import { useGastosUpdate } from "@/components/gastos/gastos-update-context"

export function FormularioGasto() {
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const montoInputRef = useRef<HTMLInputElement>(null)
  const [archivo, setArchivo] = useState<File | null>(null)
  const { triggerUpdate } = useGastosUpdate()

  // Fecha actual por defecto
  useEffect(() => {
    if (!formData.fecha_gasto) {
      const hoy = new Date().toISOString().slice(0, 10)
      setFormData((prev) => ({ ...prev, fecha_gasto: hoy }))
    }
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    // Obtener proyectos disponibles
    const fetchProyectos = async () => {
      try {
        let query = supabase.from("proyectos").select("*")

        if (user?.rol === "supervisor") {
          query = query.eq("supervisor_id", user.id)
        }

        const { data, error } = await query.order("nombre")

        if (error) {
          throw error
        }

        setProyectos(data || [])

        // Si viene un proyecto en la URL, seleccionarlo
        const proyectoParam = searchParams.get("proyecto")
        if (proyectoParam) {
          setFormData((prev) => ({ ...prev, proyecto_id: proyectoParam }))
        }
      } catch (err) {
        console.error("Error al cargar proyectos:", err)
      }
    }

    if (user) {
      fetchProyectos()
    }
  }, [user, supabase, searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Formatear valor a COP amigable
  const formatMontoCOP = (value: string | number) => {
    if (!value) return ""
    const num = typeof value === "number" ? value : Number(value.toString().replace(/[^\d]/g, ""))
    if (isNaN(num)) return ""
    return num.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
  }

  // Manejar cambio amigable en el input de monto
  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^\d]/g, "")
    if (raw.length > 12) raw = raw.slice(0, 12)
    setFormData((prev) => ({ ...prev, monto: raw }))
  }

  // Manejar archivo de evidencia
  const handleArchivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0])
    } else {
      setArchivo(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
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

      // Validar que el tipo_gasto sea uno de los valores permitidos
      const tiposPermitidos = ["honorarios", "refrigerios", "transporte", "materiales", "servicios", "otros"]
      if (!tiposPermitidos.includes(formData.tipo_gasto)) {
        throw new Error("Tipo de gasto no válido")
      }

      const { data, error: supabaseError } = await supabase
        .from("gastos_proyecto")
        .insert([
          {
            proyecto_id: formData.proyecto_id,
            tipo_gasto: formData.tipo_gasto as any,
            descripcion: formData.descripcion,
            monto,
            fecha_gasto: formData.fecha_gasto,
            responsable: formData.responsable || null,
            observaciones: formData.observaciones || null,
            aprobado: false,
            created_by: user?.id,
          },
        ])
        .select()

      if (supabaseError) {
        throw supabaseError
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
        router.push(`/dashboard/proyectos/${formData.proyecto_id}`)
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Error al registrar el gasto")
      console.error("Error al crear gasto:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Registrar Nuevo Gasto</CardTitle>
        <CardDescription>Complete los datos para registrar un gasto del proyecto</CardDescription>
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
              ¡Gasto registrado exitosamente! Redirigiendo...
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proyecto_id">Proyecto *</Label>
            <Select value={formData.proyecto_id} onValueChange={(value) => handleSelectChange("proyecto_id", value)}>
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
              <Select value={formData.tipo_gasto} onValueChange={(value) => handleSelectChange("tipo_gasto", value)}>
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
                type="text"
                inputMode="numeric"
                ref={montoInputRef}
                value={formatMontoCOP(formData.monto)}
                onChange={handleMontoChange}
                placeholder="$ 50.000"
                minLength={4}
                maxLength={15}
                required
                autoComplete="off"
                aria-label="Monto en pesos colombianos"
                onFocus={(e) => e.target.select()}
              />
              <span className="text-xs text-gray-500">Ejemplo: $ 50.000</span>
            </div>
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

          {/* Agrupar descripción y archivo juntos para mejor visual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
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
            <div className="space-y-2">
              <Label htmlFor="archivo">Evidencia (opcional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="archivo"
                  name="archivo"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleArchivoChange}
                  aria-label="Adjuntar evidencia de gasto"
                />
                {archivo && (
                  <span className="text-xs text-green-700 truncate max-w-[120px]">{archivo.name}</span>
                )}
                <Paperclip className="h-5 w-5 text-gray-400" />
              </div>
              <span className="text-xs text-gray-500">Adjunte factura, recibo o soporte (opcional)</span>
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
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Registrar Gasto"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
