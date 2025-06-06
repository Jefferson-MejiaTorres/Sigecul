"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2, FileText, Calendar, Image, Video, AudioLines, Folder } from "lucide-react"
import type { EvidenciaProyecto, Proyecto } from "@/lib/types"

interface EvidenciaConProyecto extends EvidenciaProyecto {
  proyecto?: Proyecto
}

interface ModalEliminarEvidenciaProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  evidencia: EvidenciaConProyecto | null
  onConfirmarEliminacion?: () => void
  isLoading?: boolean
}

export function ModalEliminarEvidencia({
  isOpen,
  onOpenChange,
  evidencia,
  onConfirmarEliminacion,
  isLoading = false
}: ModalEliminarEvidenciaProps) {
  if (!evidencia) return null

  const handleConfirmar = () => {
    if (onConfirmarEliminacion) {
      onConfirmarEliminacion()
    }
  }

  const getTipoEvidenciaLabel = (tipo: string) => {
    const tipos = {
      fotografia: "Fotografía",
      video: "Video",
      audio: "Audio",
      lista_asistencia: "Lista de Asistencia",
      informe: "Informe",
      documento: "Documento",
      otro: "Otro",
    }
    return tipos[tipo as keyof typeof tipos] || tipo
  }

  const getTipoEvidenciaIcon = (tipo: string) => {
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

  const getTipoEvidenciaColor = (tipo: string) => {
    const colores = {
      fotografia: "bg-purple-100 text-purple-800",
      video: "bg-blue-100 text-blue-800",
      audio: "bg-indigo-100 text-indigo-800",
      lista_asistencia: "bg-green-100 text-green-800",
      informe: "bg-yellow-100 text-yellow-800",
      documento: "bg-orange-100 text-orange-800",
      otro: "bg-gray-100 text-gray-800",
    }
    return colores[tipo as keyof typeof colores] || "bg-gray-100 text-gray-800"
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Tamaño desconocido"
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirmar eliminación de evidencia
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar esta evidencia? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información de la evidencia */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            {/* Fila principal con nombre y tipo */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    {getTipoEvidenciaIcon(evidencia.tipo_evidencia)}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 truncate">
                    {evidencia.nombre_archivo}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTipoEvidenciaColor(evidencia.tipo_evidencia)}`}>
                      {getTipoEvidenciaIcon(evidencia.tipo_evidencia)}
                      {getTipoEvidenciaLabel(evidencia.tipo_evidencia)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detalles de la evidencia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  <span className="font-medium">Proyecto:</span> {evidencia.proyecto?.nombre || "Proyecto no encontrado"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span>
                  <span className="font-medium">Fecha:</span> {new Date(evidencia.fecha_actividad).toLocaleDateString('es-CO')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 flex-shrink-0" />
                <span>
                  <span className="font-medium">Tamaño:</span> {formatFileSize(evidencia.tamaño_archivo || undefined)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span>
                  <span className="font-medium">Creada:</span> {new Date(evidencia.created_at || '').toLocaleDateString('es-CO')}
                </span>
              </div>
            </div>

            {/* Descripción si existe */}
            {evidencia.descripcion && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Descripción:</span> {evidencia.descripcion}
                </p>
              </div>
            )}
          </div>

          {/* Advertencia */}
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-medium">Esta acción es irreversible</p>
                <p>Una vez eliminada, no podrás recuperar esta evidencia ni acceder al archivo asociado.</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmar}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Eliminar Evidencia
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
