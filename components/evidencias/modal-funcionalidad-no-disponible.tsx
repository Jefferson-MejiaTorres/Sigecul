"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Info, Eye, Download } from "lucide-react"

interface ModalFuncionalidadNoDisponibleProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  tipo: "ver" | "descargar"
}

export function ModalFuncionalidadNoDisponible({
  isOpen,
  onOpenChange,
  tipo
}: ModalFuncionalidadNoDisponibleProps) {
  const getTituloYDescripcion = () => {
    if (tipo === "ver") {
      return {
        titulo: "Visualización de archivos",
        descripcion: "La funcionalidad de visualización de archivos estará disponible próximamente.",
        icono: <Eye className="h-5 w-5" />
      }
    } else {
      return {
        titulo: "Descarga de archivos",
        descripcion: "La funcionalidad de descarga de archivos estará disponible próximamente.",
        icono: <Download className="h-5 w-5" />
      }
    }
  }

  const { titulo, descripcion, icono } = getTituloYDescripcion()

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <Info className="h-5 w-5" />
            {titulo}
          </DialogTitle>
          <DialogDescription>
            {descripcion}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  {icono}
                </div>
              </div>
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Funcionalidad en desarrollo</p>
                <p>
                  Estamos trabajando en implementar esta funcionalidad. Por ahora, los archivos se almacenan en modo simulación para mantener la funcionalidad de registro de evidencias.
                </p>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">¿Qué está funcionando actualmente?</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Registro de evidencias con información detallada</li>
                <li>Organización por proyectos y tipos</li>
                <li>Filtros y búsqueda avanzada</li>
                <li>Estadísticas y resúmenes</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
