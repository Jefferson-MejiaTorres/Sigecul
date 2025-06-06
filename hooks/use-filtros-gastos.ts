// Este hook ha quedado obsoleto y ya no se utiliza en el dashboard de gastos.
// Puedes eliminar este archivo de forma segura.

"use client"

import { useState, useCallback, useMemo } from "react"

interface FiltrosGastos {
  busqueda: string
  proyecto: string
  tipo: string
  estado: string
  fechaInicio: string
  fechaFin: string
}

const filtrosIniciales: FiltrosGastos = {
  busqueda: "",
  proyecto: "todos",
  tipo: "todos",
  estado: "todos",
  fechaInicio: "",
  fechaFin: "",
}

export function useFiltrosGastos() {
  const [filtros, setFiltros] = useState<FiltrosGastos>(filtrosIniciales)

  const setFiltro = useCallback((campo: keyof FiltrosGastos, valor: string) => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor,
    }))
  }, [])

  const limpiarFiltros = useCallback(() => {
    setFiltros(filtrosIniciales)
  }, [])

  const hayFiltrosActivos = useMemo(() => {
    return Object.entries(filtros).some(([key, value]) => {
      if (key === "proyecto" || key === "tipo" || key === "estado") {
        return value !== "todos"
      }
      return value !== ""
    })
  }, [filtros])

  // Función para aplicar filtros a una lista de gastos
  const aplicarFiltros = useCallback(
    (gastos: any[], proyectos: any[] = []) => {
      let gastosFiltrados = [...gastos]

      // Filtro de búsqueda
      if (filtros.busqueda) {
        const busqueda = filtros.busqueda.toLowerCase()
        gastosFiltrados = gastosFiltrados.filter(
          (gasto) =>
            gasto.descripcion.toLowerCase().includes(busqueda) ||
            gasto.responsable?.toLowerCase().includes(busqueda) ||
            gasto.proyecto?.nombre?.toLowerCase().includes(busqueda) ||
            proyectos
              .find((p) => p.id === gasto.proyecto_id)
              ?.nombre?.toLowerCase()
              .includes(busqueda),
        )
      }

      // Filtro por proyecto
      if (filtros.proyecto !== "todos") {
        gastosFiltrados = gastosFiltrados.filter((gasto) => gasto.proyecto_id === filtros.proyecto)
      }

      // Filtro por tipo
      if (filtros.tipo !== "todos") {
        gastosFiltrados = gastosFiltrados.filter((gasto) => gasto.tipo_gasto === filtros.tipo)
      }

      // Filtro por estado
      if (filtros.estado !== "todos") {
        const aprobado = filtros.estado === "aprobado"
        gastosFiltrados = gastosFiltrados.filter((gasto) => gasto.aprobado === aprobado)
      }

      // Filtro por fecha de inicio
      if (filtros.fechaInicio) {
        gastosFiltrados = gastosFiltrados.filter((gasto) => gasto.fecha_gasto >= filtros.fechaInicio)
      }

      // Filtro por fecha de fin
      if (filtros.fechaFin) {
        gastosFiltrados = gastosFiltrados.filter((gasto) => gasto.fecha_gasto <= filtros.fechaFin)
      }

      return gastosFiltrados
    },
    [filtros],
  )

  return {
    filtros,
    setFiltro,
    limpiarFiltros,
    hayFiltrosActivos,
    aplicarFiltros,
  }
}
