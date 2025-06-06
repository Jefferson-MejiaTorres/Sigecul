"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Trash2, DollarSign, Calendar, User, Briefcase, FileText, Clock } from "lucide-react"
import { formatCOP } from "@/lib/format-cop"
import type { PagoPersonal, Proyecto, Trabajador } from "@/lib/types"

interface PagoConDetalles extends PagoPersonal {
  proyecto?: Proyecto
  trabajador?: Trabajador
}

interface ModalEliminarPagoProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  pago: PagoConDetalles | null
  onConfirmarEliminacion?: () => void
  isLoading?: boolean
}

export function ModalEliminarPago({
  isOpen,
  onOpenChange,
  pago,
  onConfirmarEliminacion,
  isLoading = false
}: ModalEliminarPagoProps) {
  if (!pago) return null

  const handleConfirmar = () => {
    if (onConfirmarEliminacion) {
      onConfirmarEliminacion()
    }
  }

  const getEstadoColor = (estado: string | null) => {
    switch (estado) {
      case "pagado":
        return "text-green-600 bg-green-100"
      case "pendiente":
        return "text-yellow-600 bg-yellow-100"
      case "cancelado":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getTipoLaborLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      "docencia": "Docencia",
      "coordinacion": "Coordinación",
      "produccion": "Producción",
      "logistica": "Logística",
      "tecnico": "Técnico",
      "artistico": "Artístico",
      "otros": "Otros"
    }
    return tipos[tipo] || tipo
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirmar eliminación del pago
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar este pago? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">          {/* Información del pago */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            {/* Fila principal con valor y estado */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-xl text-gray-900">
                  {formatCOP(pago.valor_pactado || 0)}
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(pago.estado_pago)}`}>
                {pago.estado_pago || 'Sin estado'}
              </span>
            </div>

            {/* Grid de información en dos columnas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {/* Trabajador */}
              {pago.trabajador && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="font-medium text-gray-900 truncate">{pago.trabajador.nombre}</span>
                </div>
              )}

              {/* Tipo de labor */}
              {pago.tipo_labor && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-orange-600 flex-shrink-0" />
                  <span className="text-gray-700">{getTipoLaborLabel(pago.tipo_labor)}</span>
                </div>
              )}

              {/* Fecha de pago */}
              {pago.fecha_pago && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                  <span className="text-gray-700">
                    {new Date(pago.fecha_pago).toLocaleDateString('es-CO', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}

              {/* Horas */}
              {pago.horas_trabajadas && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-teal-600 flex-shrink-0" />
                  <span className="text-gray-700">{pago.horas_trabajadas} horas</span>
                </div>
              )}

              {/* Proyecto - ocupa toda la fila */}
              {pago.proyecto && (
                <div className="flex items-center gap-2 md:col-span-2">
                  <Briefcase className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span className="text-gray-700 truncate">{pago.proyecto.nombre}</span>
                </div>
              )}
            </div>
          </div>          {/* Advertencia de eliminación */}
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="flex items-start gap-2">
                <div>
                  <p className="font-medium text-sm">⚠️ Esta acción es irreversible</p>
                  <p className="text-xs mt-1">
                    Una vez eliminado, este registro de pago se perderá permanentemente y no podrá ser recuperado.
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Información adicional para pagos pagados */}
          {pago.estado_pago === "pagado" && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <div className="flex items-start gap-2">
                  <div>
                    <p className="font-medium text-sm">💰 Pago ya procesado</p>
                    <p className="text-xs mt-1">
                      Este pago ya ha sido marcado como pagado. Eliminar este registro puede afectar 
                      el seguimiento financiero y la trazabilidad.
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          
          <Button
            onClick={handleConfirmar}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 focus:ring-red-500"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Confirmar Eliminación
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
