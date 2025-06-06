"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, UserX, DollarSign, Calendar, FileText } from "lucide-react"
import { formatCOP } from "@/lib/format-cop"
import type { PagoPersonal } from "@/lib/types"

interface ModalValidacionTrabajadorProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  trabajadorNombre: string
  pagosAsociados: PagoPersonal[]
  onConfirmarDesactivacion?: () => void
  accion: "desactivar" | "eliminar"
}

export function ModalValidacionTrabajador({
  isOpen,
  onOpenChange,
  trabajadorNombre,
  pagosAsociados,
  onConfirmarDesactivacion,
  accion = "desactivar"
}: ModalValidacionTrabajadorProps) {
  const totalPagos = pagosAsociados.reduce((sum, pago) => sum + (pago.valor_pactado || 0), 0)
  
  const fechasValidas = pagosAsociados
    .map(p => p.fecha_pago)
    .filter((fecha): fecha is string => fecha !== null)
  
  const ultimaFecha = fechasValidas.length > 0 
    ? new Date(Math.max(...fechasValidas.map(fecha => new Date(fecha).getTime())))
    : null
  
  const handleConfirmar = () => {
    if (onConfirmarDesactivacion) {
      onConfirmarDesactivacion()
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {accion === "eliminar" ? "No se puede eliminar el trabajador" : "Confirmar desactivación"}
          </DialogTitle>
          <DialogDescription>
            {accion === "eliminar" 
              ? "Este trabajador tiene pagos registrados y no puede ser eliminado."
              : "¿Estás seguro de que deseas desactivar este trabajador?"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información del trabajador */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <UserX className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-900">{trabajadorNombre}</span>
            </div>
          </div>

          {/* Información de pagos */}
          {pagosAsociados.length > 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <div className="space-y-2">
                  <p className="font-medium">
                    Este trabajador tiene {pagosAsociados.length} pago{pagosAsociados.length > 1 ? 's' : ''} registrado{pagosAsociados.length > 1 ? 's' : ''}:
                  </p>
                  
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3 w-3" />
                      <span>Valor total: {formatCOP(totalPagos)}</span>
                    </div>
                      <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {ultimaFecha 
                          ? `Último pago: ${ultimaFecha.toLocaleDateString('es-CO')}`
                          : "Sin fechas de pago registradas"
                        }
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      <span>
                        Estados: {[...new Set(pagosAsociados.map(p => p.estado_pago))].join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Mensaje según la acción */}
          {accion === "eliminar" ? (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>No es posible eliminar este trabajador</strong> porque tiene pagos registrados en el sistema. 
                Los registros de pagos deben conservarse por motivos de auditoría y trazabilidad.
                <br /><br />
                <strong>Recomendación:</strong> En su lugar, puedes desactivar el trabajador para que no aparezca en las listas activas.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Al desactivar el trabajador:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>No aparecerá en las listas de trabajadores activos</li>
                  <li>No podrá recibir nuevos pagos</li>
                  <li>Sus pagos anteriores se conservarán intactos</li>
                  <li>Podrás reactivarlo en cualquier momento</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            {accion === "eliminar" ? "Entendido" : "Cancelar"}
          </Button>
          
          {accion === "desactivar" && (
            <Button
              onClick={handleConfirmar}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
            >
              <UserX className="h-4 w-4 mr-2" />
              Confirmar Desactivación
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
