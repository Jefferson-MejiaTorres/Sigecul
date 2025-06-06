"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import type { GastoProyecto, Proyecto } from "@/lib/types"

interface GastoConProyecto extends GastoProyecto {
  proyecto?: Proyecto
}

interface GastosFiltradosContextType {
  gastosFiltrados: GastoConProyecto[]
  setGastosFiltrados: (gastos: GastoConProyecto[]) => void
  totalGastosFiltrados: number
  cantidadGastosFiltrados: number
}

const GastosFiltradosContext = createContext<GastosFiltradosContextType | undefined>(undefined)

export function GastosFiltradosProvider({ children }: { children: ReactNode }) {
  const [gastosFiltrados, setGastosFiltradosState] = useState<GastoConProyecto[]>([])

  const setGastosFiltrados = (gastos: GastoConProyecto[]) => {
    setGastosFiltradosState(gastos)
  }

  const totalGastosFiltrados = gastosFiltrados.reduce((sum, gasto) => sum + Number(gasto.monto), 0)
  const cantidadGastosFiltrados = gastosFiltrados.length

  return (
    <GastosFiltradosContext.Provider
      value={{
        gastosFiltrados,
        setGastosFiltrados,
        totalGastosFiltrados,
        cantidadGastosFiltrados,
      }}
    >
      {children}
    </GastosFiltradosContext.Provider>
  )
}

export function useGastosFiltrados() {
  const context = useContext(GastosFiltradosContext)
  if (context === undefined) {
    throw new Error("useGastosFiltrados must be used within a GastosFiltradosProvider")
  }
  return context
}
