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
import { useEvidenciasUpdate } from "@/components/evidencias/evidencias-update-context"
import { Loader2, Upload, Paperclip, Image, Video, FileText, AudioLines, Folder } from "lucide-react"
import type { Proyecto } from "@/lib/types"
import { uploadEvidencia } from "@/lib/upload-evidencia"

export function FormularioEvidencia() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [formData, setFormData] = useState({
    proyecto_id: "",
    tipo_evidencia: "",
    nombre_archivo: "",
    fecha_actividad: "",
    descripcion: "",
  })
  const [archivo, setArchivo] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { triggerUpdate } = useEvidenciasUpdate()
  const archivoInputRef = useRef<HTMLInputElement>(null)

  // Fecha actual por defecto
  useEffect(() => {
    if (!formData.fecha_actividad) {
      const hoy = new Date().toISOString().slice(0, 10)
      setFormData((prev) => ({ ...prev, fecha_actividad: hoy }))
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

  // Manejar archivo de evidencia
  const handleArchivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setArchivo(file)
      
      // Auto-rellenar nombre de archivo si está vacío
      if (!formData.nombre_archivo) {
        setFormData((prev) => ({ ...prev, nombre_archivo: file.name }))
      }
    } else {
      setArchivo(null)
    }
  }

  // Detectar tipo de evidencia automáticamente según el archivo
  useEffect(() => {
    if (archivo && !formData.tipo_evidencia) {
      const extension = archivo.name.split('.').pop()?.toLowerCase()
      let tipoAuto = "otro"
      
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension!)) {
        tipoAuto = "fotografia"
      } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(extension!)) {
        tipoAuto = "video"
      } else if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension!)) {
        tipoAuto = "documento"
      } else if (['xls', 'xlsx', 'csv'].includes(extension!)) {
        tipoAuto = "lista_asistencia"
      } else if (['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(extension!)) {
        tipoAuto = "audio"
      }
      
      console.log(`Detección automática: extensión ${extension} -> tipo ${tipoAuto}`) // Para debug
      setFormData((prev) => ({ ...prev, tipo_evidencia: tipoAuto }))
    }
  }, [archivo])

  // Obtener ícono según tipo de evidencia
  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "fotografia":
        return <Image className="h-4 w-4" />
      case "video":
        return <Video className="h-4 w-4" />
      case "audio":
        return <AudioLines className="h-4 w-4" />
      case "documento":
      case "lista_asistencia":
      case "informe":
        return <FileText className="h-4 w-4" />
      default:
        return <Folder className="h-4 w-4" />
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (!formData.proyecto_id || !formData.tipo_evidencia || !formData.fecha_actividad) {
        throw new Error("Por favor complete todos los campos obligatorios")
      }

      if (!archivo) {
        throw new Error("Por favor seleccione un archivo para subir")
      }

      // Validar que el tipo_evidencia sea uno de los valores permitidos
      // Mapear tipos complejos a tipos básicos que probablemente estén en la constraint
      let tipoValidado = formData.tipo_evidencia
      
      // Simplificar tipos complejos a tipos básicos
      if (formData.tipo_evidencia === 'lista_asistencia') {
        tipoValidado = 'documento' // Mapear lista_asistencia a documento
      } else if (formData.tipo_evidencia === 'informe') {
        tipoValidado = 'documento' // Mapear informe a documento
      }
      
      const tiposBasicos = ["fotografia", "video", "documento", "audio", "otro"]
      if (!tiposBasicos.includes(tipoValidado)) {
        throw new Error(`Tipo de evidencia no válido: ${formData.tipo_evidencia} -> ${tipoValidado}. Tipos básicos: ${tiposBasicos.join(', ')}`)
      }

      console.log(`Mapeando tipo: ${formData.tipo_evidencia} -> ${tipoValidado}`) // Para debug

      console.log("Insertando evidencia con tipo:", tipoValidado) // Para debug
      console.log("Datos completos a insertar:", {
        proyecto_id: formData.proyecto_id,
        tipo_evidencia: tipoValidado, // Usar el tipo validado
        nombre_archivo: formData.nombre_archivo || archivo.name,
        url_archivo: "pendiente...", // URL se genera después
        fecha_actividad: formData.fecha_actividad,
        descripcion: formData.descripcion || null,
        tamaño_archivo: archivo.size,
        created_by: user?.id,
      })

      // Validar tamaño de archivo (máximo 50MB)
      if (archivo.size > 50 * 1024 * 1024) {
        throw new Error("El archivo es demasiado grande. Máximo 50MB.")
      }

      setUploading(true)

      // Subir archivo a Supabase Storage
      const proyecto = proyectos.find(p => p.id === formData.proyecto_id)
      const fechaActividad = formData.fecha_actividad
      const carpetaDestino = `evidencias/${proyecto?.nombre || formData.proyecto_id}/${fechaActividad}`
      
      const urlArchivo = await uploadEvidencia(archivo, carpetaDestino, formData.nombre_archivo || archivo.name)
      
      if (!urlArchivo) {
        throw new Error("Error al subir el archivo. Inténtelo nuevamente.")
      }

      setUploading(false)

      const { data, error: supabaseError } = await supabase
        .from("evidencias_proyecto")
        .insert([
          {
            proyecto_id: formData.proyecto_id,
            tipo_evidencia: tipoValidado, // Usar el tipo validado/mapeado en lugar del original
            nombre_archivo: formData.nombre_archivo || archivo.name,
            url_archivo: urlArchivo,
            fecha_actividad: formData.fecha_actividad,
            descripcion: formData.descripcion || null,
            tamaño_archivo: archivo.size,
            created_by: user?.id,
          },
        ])
        .select()

      if (supabaseError) {
        console.error("Error de Supabase:", supabaseError)
        if (supabaseError.message.includes('constraint')) {
          throw new Error(`Error en la base de datos: ${supabaseError.message}. Verifique que el tipo de evidencia '${tipoValidado}' (mapeado desde '${formData.tipo_evidencia}') sea válido.`)
        }
        throw supabaseError
      }

      setSuccess(true)
      triggerUpdate() // Notificar actualización global de evidencias

      // Limpiar formulario
      setFormData({
        proyecto_id: formData.proyecto_id, // Mantener proyecto seleccionado
        tipo_evidencia: "",
        nombre_archivo: "",
        fecha_actividad: new Date().toISOString().slice(0, 10),
        descripcion: "",
      })
      setArchivo(null)
      if (archivoInputRef.current) {
        archivoInputRef.current.value = ""
      }

      // Redirección automática al dashboard de evidencias tras 2 segundos
      setTimeout(() => {
        setSuccess(false)
        router.push("/dashboard/evidencias")
      }, 2000)
    } catch (err: any) {
      console.error("Error completo al crear evidencia:", err)
      setError(err.message || "Error al registrar la evidencia")
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Subir Nueva Evidencia</CardTitle>
        <CardDescription>
          Complete los datos para registrar una evidencia del proyecto
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
              ¡Evidencia registrada exitosamente! Redirigiendo al dashboard...
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Proyecto */}
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

          {/* Tipo de evidencia y fecha en grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_evidencia">Tipo de Evidencia *</Label>
              <Select
                value={formData.tipo_evidencia}
                onValueChange={(value) => handleSelectChange("tipo_evidencia", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fotografia">
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Fotografía
                    </div>
                  </SelectItem>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Video
                    </div>
                  </SelectItem>
                  <SelectItem value="audio">
                    <div className="flex items-center gap-2">
                      <AudioLines className="h-4 w-4" />
                      Audio
                    </div>
                  </SelectItem>
                  <SelectItem value="lista_asistencia">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Lista de Asistencia
                    </div>
                  </SelectItem>
                  <SelectItem value="documento">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Documento
                    </div>
                  </SelectItem>
                  <SelectItem value="informe">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Informe
                    </div>
                  </SelectItem>
                  <SelectItem value="otro">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      Otro
                    </div>
                  </SelectItem>
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

          {/* Nombre del archivo */}
          <div className="space-y-2">
            <Label htmlFor="nombre_archivo">Nombre del Archivo *</Label>
            <Input
              id="nombre_archivo"
              name="nombre_archivo"
              value={formData.nombre_archivo}
              onChange={handleChange}
              placeholder="Ej: foto_taller_danza_01.jpg"
              required
            />
          </div>

          {/* Archivo y descripción en grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="archivo">Archivo de Evidencia *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="archivo"
                  name="archivo"
                  type="file"
                  accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.txt,.xls,.xlsx,.csv"
                  onChange={handleArchivoChange}
                  ref={archivoInputRef}
                  required
                  aria-label="Seleccionar archivo de evidencia"
                />
                {archivo && (
                  <span className="text-xs text-green-700 truncate max-w-[120px]">{archivo.name}</span>
                )}
                <Paperclip className="h-5 w-5 text-gray-400" />
              </div>
              <span className="text-xs text-gray-500">
                Máximo 50MB. Formatos: imágenes, videos, audios, documentos PDF/Word/Excel
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Describa la evidencia o actividad..."
                rows={3}
              />
            </div>
          </div>

          {/* Alerta informativa sobre modo simulación */}
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-700">
              <strong>Modo desarrollo:</strong> Los archivos se procesan en modo simulación. 
              La integración con almacenamiento real se implementará próximamente.
            </AlertDescription>
          </Alert>

          {/* Información adicional */}
          {archivo && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {getTipoIcon(formData.tipo_evidencia)}
                <span className="font-medium">Archivo seleccionado:</span>
                <span>{archivo.name}</span>
                <span className="text-gray-400">
                  ({(archivo.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              {formData.tipo_evidencia && (
                <div className="mt-2 text-xs text-gray-500">
                  Tipo detectado automáticamente: {formData.tipo_evidencia.replace('_', ' ')}
                </div>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-red-600 hover:bg-red-700" 
              disabled={loading || uploading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploading ? "Subiendo archivo..." : "Registrando..."}
                </>
              ) : (
                "Registrar Evidencia"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
