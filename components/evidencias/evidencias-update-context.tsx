"use client"

import React, { createContext, useContext, useState } from "react"

interface EvidenciasUpdateContextType {
  lastUpdate: number
  triggerUpdate: () => void
}

const EvidenciasUpdateContext = createContext<EvidenciasUpdateContextType | undefined>(undefined)

export function EvidenciasUpdateProvider({ children }: { children: React.ReactNode }) {
  const [lastUpdate, setLastUpdate] = useState(Date.now())

  const triggerUpdate = () => {
    setLastUpdate(Date.now())
  }

  return (
    <EvidenciasUpdateContext.Provider value={{ lastUpdate, triggerUpdate }}>
      {children}
    </EvidenciasUpdateContext.Provider>
  )
}

export function useEvidenciasUpdate() {
  const context = useContext(EvidenciasUpdateContext)
  if (context === undefined) {
    throw new Error("useEvidenciasUpdate debe usarse dentro de EvidenciasUpdateProvider")
  }
  return context
}
