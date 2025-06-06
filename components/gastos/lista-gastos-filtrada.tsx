"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useGastosUpdate } from "@/components/gastos/gastos-update-context"
import { useGastosFiltrados } from "@/components/gastos/gastos-filtrados-context"
import { FiltrosGastos } from "./filtros-gastos"
import { ListaGastos } from "./lista-gastos"
import type { GastoProyecto, Proyecto } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface GastoConProyecto extends GastoProyecto {
  proyecto?: Proyecto
}

interface ListaGastosFiltradaProps {
  filtro: "todos" | "pendientes" | "aprobados"
}

export function ListaGastosFiltrada({ filtro }: ListaGastosFiltradaProps) {
  const [gastosOriginales, setGastosOriginales] = useState<GastoConProyecto[]>([])
  const [gastosFiltradosLocal, setGastosFiltradosLocal] = useState<GastoConProyecto[]>([])
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { lastUpdate } = useGastosUpdate()
  const { setGastosFiltrados } = useGastosFiltrados()

  useEffect(() => {
    if (user) {
      fetchGastos()
    }
  }, [user, filtro, lastUpdate])

  const fetchGastos = async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener proyectos del supervisor
      const { data: proyectosData, error: proyectosError } = await supabase
        .from("proyectos")
        .select("*")
        .eq("supervisor_id", user?.id)

      if (proyectosError) {
        throw proyectosError
      }      if (!proyectosData || proyectosData.length === 0) {
        setGastosOriginales([])
        setGastosFiltradosLocal([])
        setGastosFiltrados([])
        setProyectos([])
        setLoading(false)
        return
      }

      setProyectos(proyectosData)
      const proyectoIds = proyectosData.map((p) => p.id)

      // Construir query de gastos
      let query = supabase.from("gastos_proyecto").select("*").in("proyecto_id", proyectoIds)

      // Aplicar filtro de estado según la pestaña
      if (filtro === "pendientes") {
        query = query.eq("aprobado", false)
      } else if (filtro === "aprobados") {
        query = query.eq("aprobado", true)
      }

      const { data: gastosData, error: gastosError } = await query.order("fecha_gasto", { ascending: false })

      if (gastosError) {
        throw gastosError
      }      // Combinar gastos con información del proyecto
      const gastosConProyecto =
        gastosData?.map((gasto) => ({
          ...gasto,
          proyecto: proyectosData.find((p) => p.id === gasto.proyecto_id),
        })) || []

      setGastosOriginales(gastosConProyecto)
      setGastosFiltradosLocal(gastosConProyecto) // Inicializar con todos los gastos
      setGastosFiltrados(gastosConProyecto) // Actualizar el contexto
    } catch (err: any) {
      setError(err.message || "Error al cargar los gastos")
      console.error("Error al cargar gastos:", err)
    } finally {
      setLoading(false)
    }
  }
  const handleFiltrarGastos = (gastosFiltrados: GastoConProyecto[]) => {
    setGastosFiltradosLocal(gastosFiltrados)
    setGastosFiltrados(gastosFiltrados) // Actualizar el contexto
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <FiltrosGastos
        gastos={gastosOriginales}
        proyectos={proyectos}
        onFiltrarGastos={handleFiltrarGastos}
      />      {/* Lista de gastos filtrados */}
      <ListaGastos 
        gastos={gastosFiltradosLocal}
        proyectos={proyectos}
        showFilters={false} // No mostrar filtros internos
      />
    </div>
  )
}
