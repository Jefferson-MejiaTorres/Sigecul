"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface PagosUpdateContextType {
  lastUpdate: number
  triggerUpdate: () => void
}

const PagosUpdateContext = createContext<PagosUpdateContextType | undefined>(undefined)

export function PagosUpdateProvider({ children }: { children: ReactNode }) {
  const [lastUpdate, setLastUpdate] = useState(Date.now())

  const triggerUpdate = () => {
    setLastUpdate(Date.now())
  }

  return (
    <PagosUpdateContext.Provider value={{ lastUpdate, triggerUpdate }}>
      {children}
    </PagosUpdateContext.Provider>
  )
}

export function usePagosUpdate() {
  const context = useContext(PagosUpdateContext)
  if (context === undefined) {
    throw new Error("usePagosUpdate must be used within a PagosUpdateProvider")
  }
  return context
}
