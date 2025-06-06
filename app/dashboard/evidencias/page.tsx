"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Plus, Loader2, Camera, AlertCircle, CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ListaEvidencias } from "@/components/evidencias/lista-evidencias"
import { EstadisticasEvidencias } from "@/components/evidencias/estadisticas-evidencias"
import { EvidenciasUpdateProvider } from "@/components/evidencias/evidencias-update-context"

export default function EvidenciasPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    // Limpiar mensaje después de 5 segundos
    if (mensaje) {
      const timer = setTimeout(() => setMensaje(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [mensaje])

  const mostrarMensaje = (tipo: 'success' | 'error', texto: string) => {
    setMensaje({ tipo, texto })
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
    <EvidenciasUpdateProvider>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link href="/dashboard">
              <Button variant="ghost" className="flex items-center gap-2 text-gray-600 mb-4">
                <ArrowLeft className="h-4 w-4" />
                Volver a Dashboard
              </Button>
            </Link>

            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Evidencias</h1>
                <p className="text-gray-600 mt-2">Organiza y gestiona todas las evidencias digitales de tus proyectos</p>
              </div>
              <div className="flex gap-3">
                <Link href="/dashboard/evidencias/nuevo">
                  <Button className="bg-red-600 hover:bg-red-700 flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Subir Evidencia
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Mensajes de estado */}
          {mensaje && (
            <Alert className={`mb-6 ${mensaje.tipo === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              {mensaje.tipo === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription className={mensaje.tipo === 'success' ? 'text-green-700' : 'text-red-700'}>
                {mensaje.texto}
              </AlertDescription>
            </Alert>
          )}          {/* Estadísticas Rápidas */}
          <EstadisticasEvidencias />          {/* Contenido Principal */}
          <Tabs defaultValue="todas" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger 
                value="todas"
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900"
              >
                Todas
              </TabsTrigger>
              <TabsTrigger 
                value="imagenes"
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800"
              >
                Imágenes
              </TabsTrigger>
              <TabsTrigger 
                value="videos"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
              >
                Videos
              </TabsTrigger>
              <TabsTrigger 
                value="documentos"
                className="data-[state=active]:bg-red-100 data-[state=active]:text-red-800"
              >
                Documentos
              </TabsTrigger>
              <TabsTrigger 
                value="audios"
                className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800"
              >
                Audios
              </TabsTrigger>
              <TabsTrigger 
                value="otros"
                className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-800"
              >
                Otros
              </TabsTrigger>
            </TabsList>

            <TabsContent value="todas" className="space-y-6">
              <ListaEvidencias filtro="todas" showFilters={true} />
            </TabsContent>            <TabsContent value="imagenes" className="space-y-6">
              <ListaEvidencias filtro="fotografias" showFilters={false} />
            </TabsContent>

            <TabsContent value="videos" className="space-y-6">
              <ListaEvidencias filtro="videos" showFilters={false} />
            </TabsContent>

            <TabsContent value="documentos" className="space-y-6">
              <ListaEvidencias filtro="documentos" showFilters={false} />
            </TabsContent>

            <TabsContent value="audios" className="space-y-6">
              <ListaEvidencias filtro="audios" showFilters={false} />
            </TabsContent>

            <TabsContent value="otros" className="space-y-6">
              <ListaEvidencias filtro="otros" showFilters={false} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </EvidenciasUpdateProvider>
  )
}
