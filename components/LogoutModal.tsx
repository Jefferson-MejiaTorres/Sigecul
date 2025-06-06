import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LogOut, AlertTriangle } from "lucide-react"

interface LogoutModalProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export function LogoutModal({ open, onConfirm, onCancel, loading }: LogoutModalProps) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <LogOut className="h-5 w-5" />
            Confirmar cierre de sesión
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas salir del sistema? Se cerrará tu sesión y deberás volver a iniciar sesión para acceder nuevamente.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-red-50 p-3 rounded-lg border border-red-200 flex items-start gap-2 mt-4">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">
            <p className="font-medium">Esta acción cerrará tu sesión actual</p>
            <p>Si tienes cambios sin guardar, podrías perderlos.</p>
          </div>
        </div>
        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={onConfirm} disabled={loading}>
            {loading ? "Cerrando sesión..." : "Sí, cerrar sesión"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
