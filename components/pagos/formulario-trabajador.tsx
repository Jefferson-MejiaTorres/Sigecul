"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, User, Phone, Mail, Briefcase, DollarSign, Save, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { usePagosUpdate } from "./pagos-update-context"
import type { Trabajador } from "@/lib/types"

interface FormularioTrabajadorProps {
  trabajador?: Trabajador
  onCancel: () => void
  onSuccess: () => void
}

interface FormData {
  nombre: string
  cedula: string
  telefono: string
  email: string
  especialidad: string
  valor_hora: string
}

export function FormularioTrabajador({ trabajador, onCancel, onSuccess }: FormularioTrabajadorProps) {
  const { user } = useAuth()
  const { triggerUpdate } = usePagosUpdate()
  
  const [formData, setFormData] = useState<FormData>({
    nombre: trabajador?.nombre || "",
    cedula: trabajador?.cedula || "",
    telefono: trabajador?.telefono || "",
    email: trabajador?.email || "",
    especialidad: trabajador?.especialidad || "",
    valor_hora: trabajador?.valor_hora?.toString() || "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError(null)
  }

  const validateForm = (): string | null => {
    if (!formData.nombre.trim()) return "El nombre es obligatorio"
    if (!formData.cedula.trim()) return "La cédula es obligatoria"
    
    // Validar formato de cédula (solo números)
    if (!/^\d+$/.test(formData.cedula.trim())) {
      return "La cédula debe contener solo números"
    }
    
    // Validar email si se proporciona
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      return "El formato del email no es válido"
    }
    
    // Validar valor por hora si se proporciona
    if (formData.valor_hora.trim()) {
      const valor = parseFloat(formData.valor_hora)
      if (isNaN(valor) || valor < 0) {
        return "El valor por hora debe ser un número positivo"
      }
    }

    return null
  }

  const checkCedulaExists = async (cedula: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("trabajadores")
      .select("id")
      .eq("cedula", cedula.trim())
      .eq("activo", true)

    if (error) {
      console.error("Error checking cedula:", error)
      return false
    }

    // Si estamos editando, excluir el trabajador actual
    if (trabajador) {
      return data.some(t => t.id !== trabajador.id)
    }

    return data.length > 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      // Verificar si la cédula ya existe
      const cedulaExists = await checkCedulaExists(formData.cedula)
      if (cedulaExists) {
        setError("Ya existe un trabajador registrado con esta cédula")
        setLoading(false)
        return
      }

      const trabajadorData = {
        nombre: formData.nombre.trim(),
        cedula: formData.cedula.trim(),
        telefono: formData.telefono.trim() || null,
        email: formData.email.trim() || null,
        especialidad: formData.especialidad.trim() || null,
        valor_hora: formData.valor_hora.trim() ? parseFloat(formData.valor_hora) : null,
        activo: true,
      }

      if (trabajador) {
        // Actualizar trabajador existente
        const { error: updateError } = await supabase
          .from("trabajadores")
          .update(trabajadorData)
          .eq("id", trabajador.id)

        if (updateError) throw updateError
      } else {
        // Crear nuevo trabajador
        const { error: insertError } = await supabase
          .from("trabajadores")
          .insert([trabajadorData])

        if (insertError) throw insertError
      }

      triggerUpdate()
      onSuccess()
    } catch (err: any) {
      console.error("Error saving trabajador:", err)
      setError(err.message || "Error al guardar el trabajador")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-red-600" />
          {trabajador ? "Editar Trabajador" : "Registrar Nuevo Trabajador"}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información Personal */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Información Personal
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="nombre"
                    type="text"
                    placeholder="Nombre completo del trabajador"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange("nombre", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cedula">Cédula de Ciudadanía *</Label>
                <Input
                  id="cedula"
                  type="text"
                  placeholder="Número de cédula sin puntos"
                  value={formData.cedula}
                  onChange={(e) => handleInputChange("cedula", e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono de Contacto</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="telefono"
                    type="tel"
                    placeholder="Número de teléfono"
                    value={formData.telefono}
                    onChange={(e) => handleInputChange("telefono", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Información Laboral */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Información Laboral
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="especialidad">Especialidad / Cargo</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="especialidad"
                    type="text"
                    placeholder="Ej: Tallerista, Facilitador, Instructor"
                    value={formData.especialidad}
                    onChange={(e) => handleInputChange("especialidad", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor_hora">Valor por Hora (COP)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="valor_hora"
                    type="number"
                    placeholder="Valor por hora de trabajo"
                    value={formData.valor_hora}
                    onChange={(e) => handleInputChange("valor_hora", e.target.value)}
                    className="pl-10"
                    min="0"
                    step="1000"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Este valor se usará como referencia para calcular pagos automáticamente
                </p>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
            <Button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {trabajador ? "Actualizar Trabajador" : "Registrar Trabajador"}
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 sm:flex-none sm:min-w-[120px]"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
