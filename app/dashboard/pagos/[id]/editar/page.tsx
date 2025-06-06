"use client"

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
import { ArrowLeft, Loader2, Save, Upload } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import type { PagoPersonal, Proyecto, Trabajador } from "@/lib/types"
import { usePagosUpdate, PagosUpdateProvider } from "@/components/pagos/pagos-update-context"

interface EditarPagoPageProps {
  params: Promise<{ id: string }>
}

function EditarPagoPageContent({ params }: EditarPagoPageProps) {
  const resolvedParams = use(params)
  const pagoId = resolvedParams.id
  const [pago, setPago] = useState<PagoPersonal | null>(null)
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([])
  const [formData, setFormData] = useState({
    proyecto_id: "",
    trabajador_id: "",
    tipo_labor: "",
    horas_trabajadas: "",
    valor_hora: "",
    valor_total: "",
    estado_pago: "",
    fecha_pago: "",
    observaciones: "",
    comprobante_url: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [uploading, setUploading] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const { triggerUpdate } = usePagosUpdate()
  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    fetchPagoYDatos()
  }, [pagoId, user, router])

  const fetchPagoYDatos = async () => {
    try {
      setLoading(true)

      // Verificar que el usuario esté autenticado
      if (!user) {
        router.push("/login")
        return
      }      // Obtener el pago
      const { data: pagoData, error: pagoError } = await supabase
        .from("pagos_personal")
        .select("*")
        .eq("id", pagoId)
        .single()

      if (pagoError) {
        throw pagoError
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

      // Verificar que el pago pertenece a un proyecto del supervisor
      const proyectoDelPago = proyectosData.find((p) => p.id === pagoData.proyecto_id)
      if (!proyectoDelPago) {
        throw new Error("No tienes permisos para editar este pago")
      }

      // Obtener trabajadores
      const { data: trabajadoresData, error: trabajadoresError } = await supabase
        .from("trabajadores")
        .select("*")
        .order("nombre")

      if (trabajadoresError) {
        throw trabajadoresError
      }

      setPago(pagoData)
      setProyectos(proyectosData)
      setTrabajadores(trabajadoresData)
      setFormData({
        proyecto_id: pagoData.proyecto_id || "",
        trabajador_id: pagoData.trabajador_id || "",
        tipo_labor: pagoData.tipo_labor || "",
        horas_trabajadas: pagoData.horas_trabajadas?.toString() || "",
        valor_hora: ((pagoData as any).valor_hora || 0).toString(),
        valor_total: pagoData.valor_pactado?.toString() || "",
        estado_pago: pagoData.estado_pago || "",
        fecha_pago: pagoData.fecha_pago || "",
        observaciones: pagoData.observaciones || "",
        comprobante_url: pagoData.comprobante_url || "",
      })
    } catch (err: any) {
      setError(err.message || "Error al cargar el pago")
      console.error("Error al cargar pago:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }
      
      // Calcular valor total automáticamente
      if (field === "horas_trabajadas" || field === "valor_hora") {
        const horas = parseFloat(field === "horas_trabajadas" ? value : newData.horas_trabajadas) || 0
        const valorHora = parseFloat(field === "valor_hora" ? value : newData.valor_hora) || 0
        newData.valor_total = (horas * valorHora).toString()
      }
      
      return newData
    })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `comprobantes/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('comprobantes-pagos')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('comprobantes-pagos')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, comprobante_url: publicUrl }))
    } catch (err: any) {
      console.error('Error al subir archivo:', err)
      setError('Error al subir el comprobante')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const updateData: Partial<PagoPersonal> = {
        proyecto_id: formData.proyecto_id,
        trabajador_id: formData.trabajador_id,
        tipo_labor: formData.tipo_labor,
        horas_trabajadas: parseFloat(formData.horas_trabajadas) || 0,
        valor_pactado: parseFloat(formData.valor_total) || 0,
        estado_pago: formData.estado_pago,
        fecha_pago: formData.fecha_pago || null,
        observaciones: formData.observaciones,        comprobante_url: formData.comprobante_url,
      }

      const { error } = await supabase
        .from("pagos_personal")
        .update(updateData)
        .eq("id", pagoId)

      if (error) {
        throw error
      }

      setSuccess(true)
      triggerUpdate() // Notificar actualización global de pagos

      setTimeout(() => {
        router.push("/dashboard/pagos")
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Error al actualizar el pago")
      console.error("Error al actualizar pago:", err)
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

  if (error && !pago) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href="/dashboard/pagos">
              <Button variant="ghost" className="flex items-center gap-2 text-gray-600">
                <ArrowLeft className="h-4 w-4" />
                Volver a Pagos
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
          <Link href="/dashboard/pagos">
            <Button variant="ghost" className="flex items-center gap-2 text-gray-600">
              <ArrowLeft className="h-4 w-4" />
              Volver a Pagos
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Editar Pago</h1>
          <p className="text-gray-600 mt-2">Modifica la información del pago registrado</p>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-700">
              ¡Pago actualizado exitosamente! Redirigiendo...
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Información del Pago</CardTitle>
            <CardDescription>Actualiza los datos del pago</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="proyecto">Proyecto *</Label>
                  <Select
                    value={formData.proyecto_id}
                    onValueChange={(value) => handleInputChange("proyecto_id", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un proyecto" />
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
                  <Label htmlFor="trabajador">Trabajador *</Label>
                  <Select
                    value={formData.trabajador_id}
                    onValueChange={(value) => handleInputChange("trabajador_id", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un trabajador" />
                    </SelectTrigger>
                    <SelectContent>
                      {trabajadores.map((trabajador) => (
                        <SelectItem key={trabajador.id} value={trabajador.id}>
                          {trabajador.nombre} - {trabajador.cedula}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="tipo_labor">Tipo de Labor *</Label>
                  <Select
                    value={formData.tipo_labor}
                    onValueChange={(value) => handleInputChange("tipo_labor", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de labor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="artística">Artística</SelectItem>
                      <SelectItem value="técnica">Técnica</SelectItem>
                      <SelectItem value="administrativa">Administrativa</SelectItem>
                      <SelectItem value="logística">Logística</SelectItem>
                      <SelectItem value="producción">Producción</SelectItem>
                      <SelectItem value="otros">Otros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado_pago">Estado del Pago *</Label>
                  <Select
                    value={formData.estado_pago}
                    onValueChange={(value) => handleInputChange("estado_pago", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Estado del pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="pagado">Pagado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="horas_trabajadas">Horas Trabajadas *</Label>
                  <Input
                    id="horas_trabajadas"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.horas_trabajadas}
                    onChange={(e) => handleInputChange("horas_trabajadas", e.target.value)}
                    required
                    placeholder="Ej: 8"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_hora">Valor por Hora *</Label>
                  <Input
                    id="valor_hora"
                    type="number"
                    min="0"
                    value={formData.valor_hora}
                    onChange={(e) => handleInputChange("valor_hora", e.target.value)}
                    required
                    placeholder="Ej: 15000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_total">Valor Total</Label>
                  <Input
                    id="valor_total"
                    type="number"
                    value={formData.valor_total}
                    readOnly
                    className="bg-gray-50"
                    placeholder="Se calcula automáticamente"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_pago">Fecha de Pago</Label>
                <Input
                  id="fecha_pago"
                  type="date"
                  value={formData.fecha_pago}
                  onChange={(e) => handleInputChange("fecha_pago", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comprobante">Comprobante de Pago</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="comprobante"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="flex-1"
                  />
                  {uploading && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Subiendo...
                    </div>
                  )}
                </div>
                {formData.comprobante_url && (
                  <p className="text-sm text-green-600">✓ Comprobante cargado</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) => handleInputChange("observaciones", e.target.value)}
                  placeholder="Observaciones adicionales sobre el pago..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={saving || !formData.proyecto_id || !formData.trabajador_id}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Actualizar Pago
                    </>
                  )}
                </Button>
                <Link href="/dashboard/pagos">
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function EditarPagoPage({ params }: EditarPagoPageProps) {
  return (
    <PagosUpdateProvider>
      <EditarPagoPageContent params={params} />
    </PagosUpdateProvider>
  )
}
