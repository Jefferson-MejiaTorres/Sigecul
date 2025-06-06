"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { FormularioPago } from "@/components/pagos/formulario-pago"
import { PagosUpdateProvider } from "@/components/pagos/pagos-update-context"

export default function NuevoPagoPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  if (!user) {
    return null
  }
  return (
    <PagosUpdateProvider>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href="/dashboard/pagos">
              <Button variant="ghost" className="flex items-center gap-2 text-gray-600">
                <ArrowLeft className="h-4 w-4" />
                Volver a Pagos
              </Button>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Registrar Nuevo Pago</h1>
            <p className="text-gray-600 mt-2">Registra un nuevo pago a trabajador temporal</p>
          </div>

          <FormularioPago />
        </div>
      </div>
    </PagosUpdateProvider>
  )
}
