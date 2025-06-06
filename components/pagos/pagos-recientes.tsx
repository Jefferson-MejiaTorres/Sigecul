"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, CreditCard, Calendar, User, FileText, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import type { PagoPersonal, Proyecto, Trabajador } from "@/lib/types"
import Link from "next/link"
import { formatCOP } from "@/lib/format-cop"

interface PagoConProyectoYTrabajador extends PagoPersonal {
  proyecto?: Proyecto
  trabajador?: Trabajador
}

export function PagosRecientes() {
  const [pagos, setPagos] = useState<PagoConProyectoYTrabajador[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchPagosRecientes()
    }
  }, [user])

  const fetchPagosRecientes = async () => {
    try {
      setLoading(true)

      // Obtener proyectos del supervisor
      const { data: proyectos } = await supabase.from("proyectos").select("*").eq("supervisor_id", user?.id)

      if (!proyectos || proyectos.length === 0) {
        setLoading(false)
        return
      }

      const proyectoIds = proyectos.map((p) => p.id)

      // Obtener trabajadores para mostrar nombres
      const { data: trabajadores } = await supabase.from("trabajadores").select("*")

      // Obtener los últimos 5 pagos
      const { data: pagosData } = await supabase
        .from("pagos_personal")
        .select("*")
        .in("proyecto_id", proyectoIds)
        .order("created_at", { ascending: false })
        .limit(5)

      if (pagosData) {
        const pagosConDatos = pagosData.map((pago) => ({
          ...pago,
          proyecto: proyectos.find((p) => p.id === pago.proyecto_id),
          trabajador: trabajadores?.find((t) => t.id === pago.trabajador_id),
        }))
        setPagos(pagosConDatos)
      }
    } catch (error) {
      console.error("Error al cargar pagos recientes:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTipoLaborLabel = (tipo: string) => {
    const tipos = {
      artistica: "Artística",
      tecnica: "Técnica", 
      administrativa: "Administrativa",
      logistica: "Logística",
      produccion: "Producción",
      otros: "Otros",
    }
    return tipos[tipo as keyof typeof tipos] || tipo
  }

  const getTipoLaborColor = (tipo: string) => {
    const colores = {
      artistica: "bg-purple-100 text-purple-800",
      tecnica: "bg-blue-100 text-blue-800",
      administrativa: "bg-green-100 text-green-800",
      logistica: "bg-yellow-100 text-yellow-800",
      produccion: "bg-red-100 text-red-800",
      otros: "bg-gray-100 text-gray-800",
    }
    return colores[tipo as keyof typeof colores] || "bg-gray-100 text-gray-800"
  }

  const getEstadoPagoColor = (estado: string) => {
    const colores = {
      pendiente: "bg-yellow-100 text-yellow-800",
      pagado: "bg-green-100 text-green-800",
      cancelado: "bg-red-100 text-red-800",
    }
    return colores[estado as keyof typeof colores] || "bg-gray-100 text-gray-800"
  }

  const getEstadoPagoLabel = (estado: string) => {
    const estados = {
      pendiente: "Pendiente",
      pagado: "Pagado",
      cancelado: "Cancelado",
    }
    return estados[estado as keyof typeof estados] || estado
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-red-600" />
        <span className="ml-2">Cargando pagos recientes...</span>
      </div>
    )
  }

  if (pagos.length === 0) {
    return (
      <div className="text-center py-8">
        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay pagos registrados</h3>
        <p className="text-gray-500 mb-4">Comienza registrando el primer pago a trabajadores</p>
        <Link href="/dashboard/pagos/nuevo-pago">
          <Button className="bg-red-600 hover:bg-red-700">Registrar Primer Pago</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {pagos.map((pago) => (
        <div key={pago.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
          <div className="flex-1">            <div className="flex items-center gap-3 mb-2">
              <Badge className={getTipoLaborColor(pago.tipo_labor)}>{getTipoLaborLabel(pago.tipo_labor)}</Badge>
              <Badge className={getEstadoPagoColor(pago.estado_pago || 'pendiente')}>
                {getEstadoPagoLabel(pago.estado_pago || 'pendiente')}
              </Badge>
            </div>

            <h4 className="font-semibold text-gray-900 mb-1">
              {pago.trabajador?.nombre || "Trabajador no encontrado"}
            </h4>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{pago.proyecto?.nombre}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(pago.fecha_actividad).toLocaleDateString()}</span>
              </div>
              {pago.horas_trabajadas && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{pago.horas_trabajadas}h</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">{formatCOP(pago.valor_pactado)}</p>
              <p className="text-xs text-gray-500">{new Date(pago.created_at).toLocaleDateString()}</p>
            </div>

            <Link href={`/dashboard/pagos/${pago.id}/editar`}>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                Ver
              </Button>
            </Link>
          </div>
        </div>
      ))}

      {pagos.length === 5 && (
        <div className="text-center pt-4">
          <Link href="/dashboard/pagos">
            <Button variant="outline">Ver Todos los Pagos</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
