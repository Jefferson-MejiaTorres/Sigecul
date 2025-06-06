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
import { Loader2, Paperclip } from "lucide-react"
import type { Proyecto, Trabajador } from "@/lib/types"
import { formatCOP } from "@/lib/format-cop"
import { usePagosUpdate } from "@/components/pagos/pagos-update-context"

export function FormularioPago() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([])
  const [formData, setFormData] = useState({
    proyecto_id: "",
    trabajador_id: "",
    fecha_actividad: "",
    tipo_labor: "",
    horas_trabajadas: "",
    valor_pactado: "",
    estado_pago: "pendiente",
    fecha_pago: "",
    observaciones: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const valorInputRef = useRef<HTMLInputElement>(null)
  const [archivo, setArchivo] = useState<File | null>(null)
  const { triggerUpdate } = usePagosUpdate()

  // Fecha actual por defecto
  useEffect(() => {
    if (!formData.fecha_actividad) {
      const hoy = new Date().toISOString().slice(0, 10)
      setFormData((prev) => ({ ...prev, fecha_actividad: hoy }))
    }
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    // Obtener proyectos y trabajadores disponibles
    const fetchData = async () => {
      try {
        // Obtener proyectos
        let queryProyectos = supabase.from("proyectos").select("*")
        if (user?.rol === "supervisor") {
          queryProyectos = queryProyectos.eq("supervisor_id", user.id)
        }
        const { data: proyectosData, error: proyectosError } = await queryProyectos.order("nombre")
        if (proyectosError) throw proyectosError
        setProyectos(proyectosData || [])

        // Obtener trabajadores activos
        const { data: trabajadoresData, error: trabajadoresError } = await supabase
          .from("trabajadores")
          .select("*")
          .eq("activo", true)
          .order("nombre")
        if (trabajadoresError) throw trabajadoresError
        setTrabajadores(trabajadoresData || [])

        // Si viene un proyecto en la URL, seleccionarlo
        const proyectoParam = searchParams.get("proyecto")
        if (proyectoParam) {
          setFormData((prev) => ({ ...prev, proyecto_id: proyectoParam }))
        }

        // Si viene un trabajador en la URL, seleccionarlo
        const trabajadorParam = searchParams.get("trabajador")
        if (trabajadorParam) {
          setFormData((prev) => ({ ...prev, trabajador_id: trabajadorParam }))
        }
      } catch (err) {
        console.error("Error al cargar datos:", err)
      }
    }

    if (user) {
      fetchData()
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
  const formatValorCOP = (value: string | number) => {
    if (!value) return ""
    const num = typeof value === "number" ? value : Number(value.toString().replace(/[^\d]/g, ""))
    if (isNaN(num)) return ""
    return num.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
  }

  // Manejar cambio amigable en el input de valor
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^\d]/g, "")
    if (raw.length > 12) raw = raw.slice(0, 12)
    setFormData((prev) => ({ ...prev, valor_pactado: raw }))
  }

  // Manejar cambio en horas trabajadas
  const handleHorasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Permitir números decimales con hasta 2 decimales
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setFormData((prev) => ({ ...prev, horas_trabajadas: value }))
    }
  }

  // Manejar archivo de comprobante
  const handleArchivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0])
    } else {
      setArchivo(null)
    }
  }

  // Calcular valor automáticamente cuando se selecciona trabajador y se ingresa horas
  useEffect(() => {
    if (formData.trabajador_id && formData.horas_trabajadas) {
      const trabajador = trabajadores.find(t => t.id === formData.trabajador_id)
      if (trabajador && trabajador.valor_hora && Number(formData.horas_trabajadas) > 0) {
        const valorCalculado = trabajador.valor_hora * Number(formData.horas_trabajadas)
        setFormData(prev => ({ ...prev, valor_pactado: valorCalculado.toString() }))
      }
    }
  }, [formData.trabajador_id, formData.horas_trabajadas, trabajadores])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (
        !formData.proyecto_id ||
        !formData.trabajador_id ||
        !formData.fecha_actividad ||
        !formData.tipo_labor ||
        !formData.valor_pactado
      ) {
        throw new Error("Por favor complete todos los campos obligatorios")
      }

      const valorPactado = Number.parseFloat(formData.valor_pactado)
      if (isNaN(valorPactado) || valorPactado <= 0) {
        throw new Error("El valor pactado debe ser un número válido mayor a cero")
      }

      const horasTrabajadas = formData.horas_trabajadas ? Number.parseFloat(formData.horas_trabajadas) : null
      if (formData.horas_trabajadas && (isNaN(horasTrabajadas!) || horasTrabajadas! <= 0)) {
        throw new Error("Las horas trabajadas deben ser un número válido mayor a cero")
      }

      // Validar que el tipo de labor sea uno de los valores permitidos
      const tiposPermitidos = ["artistica", "tecnica", "administrativa", "logistica", "produccion", "otros"]
      if (!tiposPermitidos.includes(formData.tipo_labor)) {
        throw new Error("Tipo de labor no válido")
      }

      const { data, error: supabaseError } = await supabase
        .from("pagos_personal")
        .insert([
          {
            proyecto_id: formData.proyecto_id,
            trabajador_id: formData.trabajador_id,
            fecha_actividad: formData.fecha_actividad,
            tipo_labor: formData.tipo_labor,
            horas_trabajadas: horasTrabajadas,
            valor_pactado: valorPactado,
            estado_pago: formData.estado_pago || "pendiente",
            fecha_pago: formData.fecha_pago || null,
            observaciones: formData.observaciones || null,
            created_by: user?.id,
          },
        ])
        .select()

      if (supabaseError) {
        throw supabaseError
      }

      setSuccess(true)
      triggerUpdate() // Notificar actualización global de pagos

      setTimeout(() => {
        router.push(`/dashboard/pagos`)
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Error al registrar el pago")
      console.error("Error al crear pago:", err)
    } finally {
      setLoading(false)
    }
  }

  const TIPOS_LABOR = [
    { value: "artistica", label: "Artística", icon: "🎭" },
    { value: "tecnica", label: "Técnica", icon: "🔧" },
    { value: "administrativa", label: "Administrativa", icon: "📋" },
    { value: "logistica", label: "Logística", icon: "📦" },
    { value: "produccion", label: "Producción", icon: "🎬" },
    { value: "otros", label: "Otros", icon: "📄" }
  ]

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Registrar Nuevo Pago Personal</CardTitle>
        <CardDescription>Complete los datos para registrar un pago a trabajador temporal</CardDescription>
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
              ¡Pago registrado exitosamente! Redirigiendo...
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="trabajador_id">Trabajador *</Label>
              <Select value={formData.trabajador_id} onValueChange={(value) => handleSelectChange("trabajador_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un trabajador" />
                </SelectTrigger>
                <SelectContent>
                  {trabajadores.map((trabajador) => (
                    <SelectItem key={trabajador.id} value={trabajador.id}>
                      {trabajador.nombre} - {trabajador.especialidad || "General"}
                      {trabajador.valor_hora && ` (${formatCOP(trabajador.valor_hora)}/h)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_labor">Tipo de Labor *</Label>
              <Select value={formData.tipo_labor} onValueChange={(value) => handleSelectChange("tipo_labor", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_LABOR.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      <span className="flex items-center gap-2">
                        <span>{tipo.icon}</span>
                        {tipo.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_actividad">Fecha de Actividad *</Label>
              <Input
                id="fecha_actividad"
                name="fecha_actividad"
                type="date"
                value={formData.fecha_actividad}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="horas_trabajadas">Horas Trabajadas</Label>
              <Input
                id="horas_trabajadas"
                name="horas_trabajadas"
                type="text"
                inputMode="decimal"
                value={formData.horas_trabajadas}
                onChange={handleHorasChange}
                placeholder="Ej: 8.5"
                aria-label="Horas trabajadas"
              />
              <span className="text-xs text-gray-500">Ejemplo: 8.5 horas</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_pactado">Valor Pactado ($) *</Label>
              <Input
                id="valor_pactado"
                name="valor_pactado"
                type="text"
                inputMode="numeric"
                ref={valorInputRef}
                value={formatValorCOP(formData.valor_pactado)}
                onChange={handleValorChange}
                placeholder="$ 150.000"
                minLength={4}
                maxLength={15}
                required
                autoComplete="off"
                aria-label="Valor pactado en pesos colombianos"
                onFocus={(e) => e.target.select()}
              />
              <span className="text-xs text-gray-500">Se calcula automáticamente si el trabajador tiene valor/hora</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estado_pago">Estado del Pago</Label>
              <Select value={formData.estado_pago} onValueChange={(value) => handleSelectChange("estado_pago", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      Pendiente
                    </span>
                  </SelectItem>
                  <SelectItem value="pagado">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Pagado
                    </span>
                  </SelectItem>
                  <SelectItem value="cancelado">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      Cancelado
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.estado_pago === "pagado" && (
              <div className="space-y-2">
                <Label htmlFor="fecha_pago">Fecha de Pago</Label>
                <Input
                  id="fecha_pago"
                  name="fecha_pago"
                  type="date"
                  value={formData.fecha_pago}
                  onChange={handleChange}
                />
              </div>
            )}
          </div>

          {/* Agrupar archivo y observaciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="archivo">Comprobante (opcional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="archivo"
                  name="archivo"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleArchivoChange}
                  aria-label="Adjuntar comprobante de pago"
                />
                {archivo && (
                  <span className="text-xs text-green-700 truncate max-w-[120px]">{archivo.name}</span>
                )}
                <Paperclip className="h-5 w-5 text-gray-400" />
              </div>
              <span className="text-xs text-gray-500">Adjunte comprobante de pago o contrato (opcional)</span>
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
                "Registrar Pago"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
