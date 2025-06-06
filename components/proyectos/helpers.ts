// helpers para proyectos: badges, progreso, colores, etc.
import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Clock, FolderOpen, CheckCircle, XCircle } from "lucide-react"
import type { Proyecto } from "@/lib/types"

export function getEstadoBadge(estado: string) {
  switch (estado) {
    case "planificacion":
      return React.createElement(Badge, { className: "bg-blue-100 text-blue-800 flex items-center gap-1" },
        React.createElement(Clock, { className: "h-3 w-3" }), " En Planificación"
      )
    case "activo":
      return React.createElement(Badge, { className: "bg-green-100 text-green-800 flex items-center gap-1" },
        React.createElement(FolderOpen, { className: "h-3 w-3" }), " Activo"
      )
    case "finalizado":
      return React.createElement(Badge, { className: "bg-gray-100 text-gray-800 flex items-center gap-1" },
        React.createElement(CheckCircle, { className: "h-3 w-3" }), " Finalizado"
      )
    case "cancelado":
      return React.createElement(Badge, { className: "bg-red-100 text-red-800 flex items-center gap-1" },
        React.createElement(XCircle, { className: "h-3 w-3" }), " Cancelado"
      )
    default:
      return React.createElement(Badge, null, "Desconocido")
  }
}

export function getEstadoColor(estado: string) {
  switch (estado) {
    case "planificacion":
      return "border-l-blue-500"
    case "activo":
      return "border-l-green-500"
    case "finalizado":
      return "border-l-gray-500"
    case "cancelado":
      return "border-l-red-500"
    default:
      return "border-l-gray-300"
  }
}

export function calcularProgreso(proyecto: Proyecto) {
  const total = Number(proyecto.presupuesto_total)
  const ejecutado = Number(proyecto.presupuesto_ejecutado)
  return total > 0 ? Math.round((ejecutado / total) * 100) : 0
}

export function calcularDiasTranscurridos(fechaInicio: string) {
  const inicio = new Date(fechaInicio)
  const hoy = new Date()
  const diferencia = hoy.getTime() - inicio.getTime()
  return Math.floor(diferencia / (1000 * 3600 * 24))
}
