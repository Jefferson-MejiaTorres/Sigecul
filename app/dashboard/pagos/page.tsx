"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowLeft, Plus, Loader2, Users, CreditCard, TrendingUp, AlertCircle, CheckCircle, Download } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { PagosUpdateProvider, EstadisticasPagos, ListaPagos, AnalisisPagos, ListaTrabajadores, ExportacionAvanzadaPagos } from "@/components/pagos"
import { useExportarPagos } from "@/hooks/use-exportar-pagos"

export default function PagosPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { exportarCSV, exportarExcel, exportarPDF, exportando, error, limpiarError } = useExportarPagos()
  const [mostrarExito, setMostrarExito] = useState(false)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  const handleExportarCSV = async () => {
    try {
      limpiarError()
      await exportarCSV()
      
      // Mostrar mensaje de éxito
      setMostrarExito(true)
      setTimeout(() => setMostrarExito(false), 3000)
      
    } catch (error) {
      // El error ya se maneja en el hook
    }
  }

  const handleExportarExcel = async () => {
    try {
      limpiarError()
      await exportarExcel()
      
      // Mostrar mensaje de éxito
      setMostrarExito(true)
      setTimeout(() => setMostrarExito(false), 3000)
      
    } catch (error) {
      // El error ya se maneja en el hook
    }
  }

  if (authLoading) {
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
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link href="/dashboard">
              <Button variant="ghost" className="flex items-center gap-2 text-gray-600 mb-4">
                <ArrowLeft className="h-4 w-4" />
                Volver a Dashboard
              </Button>
            </Link>            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Control de Pagos al Personal</h1>
                <p className="text-gray-600 mt-2">Gestiona trabajadores temporales y sus pagos</p>
              </div>
              <div className="flex gap-3">
                <div className="flex gap-2 items-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                          onClick={handleExportarExcel}
                          disabled={exportando}
                        >
                          {exportando ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Exportando...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4" />
                              Exportar Excel
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Reporte profesional con múltiples hojas y análisis</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <ExportacionAvanzadaPagos />
                </div>
                <Link href="/dashboard/pagos/nuevo-pago">
                  <Button className="bg-red-600 hover:bg-red-700 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Registrar Pago
                  </Button>
                </Link>
              </div>
            </div>          </div>

          {/* Mensajes de estado para exportación */}
          {error && (
            <Alert className="border-red-200 bg-red-50 mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Mensajes de éxito */}
          {mostrarExito && (
            <Alert className="border-green-200 bg-green-50 mb-6">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-700">
                ¡Archivo exportado exitosamente! La descarga debería comenzar automáticamente.
              </AlertDescription>
            </Alert>
          )}

          {/* Estadísticas */}
          <EstadisticasPagos />

          {/* Contenido Principal */}
          <Tabs defaultValue="pagos" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="pagos">Pagos</TabsTrigger>
              <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
              <TabsTrigger value="pagados">Pagados</TabsTrigger>
              <TabsTrigger value="trabajadores">Trabajadores</TabsTrigger>
              <TabsTrigger value="analisis">Análisis</TabsTrigger>
            </TabsList>            <TabsContent value="pagos" className="space-y-6">
              <ListaPagos filtro="todos" showFilters={true} />
            </TabsContent>

            <TabsContent value="pendientes" className="space-y-6">
              <ListaPagos filtro="pendientes" showFilters={false} />
            </TabsContent>

            <TabsContent value="pagados" className="space-y-6">
              <ListaPagos filtro="pagados" showFilters={false} />
            </TabsContent>

            <TabsContent value="trabajadores" className="space-y-6">
              <ListaTrabajadores />
            </TabsContent>

            <TabsContent value="analisis" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Análisis de Pagos</CardTitle>
                  <CardDescription>Visualiza la distribución y evolución de los pagos registrados</CardDescription>
                </CardHeader>
                <CardContent>
                  <AnalisisPagos />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PagosUpdateProvider>
  )
}
