"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, DollarSign, Calendar, User, FileText, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import type { GastoProyecto, Proyecto } from "@/lib/types"
import Link from "next/link"
import { formatCOP } from "@/lib/format-cop"

interface GastoConProyecto extends GastoProyecto {
  proyecto?: Proyecto
}

export function GastosRecientes() {
  const [gastos, setGastos] = useState<GastoConProyecto[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchGastosRecientes()
    }
  }, [user])

  const fetchGastosRecientes = async () => {
    try {
      setLoading(true)

      // Obtener proyectos del supervisor
      const { data: proyectos } = await supabase.from("proyectos").select("*").eq("supervisor_id", user?.id)

      if (!proyectos || proyectos.length === 0) {
        setLoading(false)
        return
      }

      const proyectoIds = proyectos.map((p) => p.id)

      // Obtener los últimos 5 gastos
      const { data: gastosData } = await supabase
        .from("gastos_proyecto")
        .select("*")
        .in("proyecto_id", proyectoIds)
        .order("created_at", { ascending: false })
        .limit(5)

      if (gastosData) {
        const gastosConProyecto = gastosData.map((gasto) => ({
          ...gasto,
          proyecto: proyectos.find((p) => p.id === gasto.proyecto_id),
        }))
        setGastos(gastosConProyecto)
      }
    } catch (error) {
      console.error("Error al cargar gastos recientes:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTipoGastoLabel = (tipo: string) => {
    const tipos = {
      honorarios: "Honorarios",
      refrigerios: "Refrigerios",
      transporte: "Transporte",
      materiales: "Materiales",
      servicios: "Servicios",
      otros: "Otros",
    }
    return tipos[tipo as keyof typeof tipos] || tipo
  }

  const getTipoGastoColor = (tipo: string) => {
    const colores = {
      honorarios: "bg-blue-100 text-blue-800",
      refrigerios: "bg-green-100 text-green-800",
      transporte: "bg-yellow-100 text-yellow-800",
      materiales: "bg-purple-100 text-purple-800",
      servicios: "bg-orange-100 text-orange-800",
      otros: "bg-gray-100 text-gray-800",
    }
    return colores[tipo as keyof typeof colores] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-red-600" />
        <span className="ml-2">Cargando gastos recientes...</span>
      </div>
    )
  }

  if (gastos.length === 0) {
    return (
      <div className="text-center py-8">
        <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay gastos registrados</h3>
        <p className="text-gray-500 mb-4">Comienza registrando el primer gasto de tus proyectos</p>
        <Link href="/dashboard/gastos/nuevo">
          <Button className="bg-red-600 hover:bg-red-700">Registrar Primer Gasto</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {gastos.map((gasto) => (
        <div key={gasto.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge className={getTipoGastoColor(gasto.tipo_gasto)}>{getTipoGastoLabel(gasto.tipo_gasto)}</Badge>
              <Badge variant={gasto.aprobado ? "default" : "secondary"}>
                {gasto.aprobado ? "Aprobado" : "Pendiente"}
              </Badge>
            </div>

            <h4 className="font-semibold text-gray-900 mb-1">{gasto.descripcion}</h4>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{gasto.proyecto?.nombre}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(gasto.fecha_gasto).toLocaleDateString()}</span>
              </div>
              {gasto.responsable && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{gasto.responsable}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">{formatCOP(gasto.monto)}</p>
              <p className="text-xs text-gray-500">{new Date(gasto.created_at).toLocaleDateString()}</p>
            </div>

            <Link href={`/dashboard/proyectos/${gasto.proyecto_id}`}>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                Ver
              </Button>
            </Link>
          </div>
        </div>
      ))}

      {gastos.length === 5 && (
        <div className="text-center pt-4">
          <Link href="/dashboard/gastos">
            <Button variant="outline">Ver Todos los Gastos</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
