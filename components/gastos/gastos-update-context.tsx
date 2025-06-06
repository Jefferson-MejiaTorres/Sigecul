"use client"
import React, { createContext, useContext, useState, useCallback } from "react"

interface GastosUpdateContextType {
  lastUpdate: number
  triggerUpdate: () => void
}

const GastosUpdateContext = createContext<GastosUpdateContextType | undefined>(undefined)

export function GastosUpdateProvider({ children }: { children: React.ReactNode }) {
  const [lastUpdate, setLastUpdate] = useState(Date.now())

  const triggerUpdate = useCallback(() => {
    setLastUpdate(Date.now())
  }, [])

  return (
    <GastosUpdateContext.Provider value={{ lastUpdate, triggerUpdate }}>
      {children}
    </GastosUpdateContext.Provider>
  )
}

export function useGastosUpdate() {
  const ctx = useContext(GastosUpdateContext)
  if (!ctx) throw new Error("useGastosUpdate debe usarse dentro de GastosUpdateProvider")
  return ctx
}
