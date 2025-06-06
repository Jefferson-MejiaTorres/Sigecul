"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft, 
  Loader2, 
  FileText, 
  Download, 
  BarChart3, 
  TrendingUp, 
  FileSpreadsheet, 
  Calendar,
  Filter,
  CheckCircle,
  AlertCircle,
  PieChart,
  DollarSign,
  FolderOpen,
  Camera,
  CreditCard
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { 
  GeneradorReportes,
  EstadisticasReportes,
  ReportesConsolidados,
  FiltrosReportes,
  HistorialReportes
} from "@/components/reportes"

export default function ReportesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [reporteGenerandose, setReporteGenerandose] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  const mostrarMensaje = (tipo: 'success' | 'error', texto: string) => {
    setMensaje({ tipo, texto })
    setTimeout(() => setMensaje(null), 5000)
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
              <h1 className="text-3xl font-bold text-gray-900">Reportes y Análisis</h1>
              <p className="text-gray-600 mt-2">Genera reportes consolidados de tus proyectos, gastos, pagos y evidencias</p>
            </div>
            <div className="flex gap-3">
              <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                {user.rol === 'supervisor' ? 'Supervisor' : user.rol === 'admin' ? 'Administrador' : 'Presidente'}
              </Badge>
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
        )}

        {/* Estadísticas rápidas */}
        <EstadisticasReportes />

        {/* Contenido Principal */}
        <Tabs defaultValue="generador" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger 
              value="generador"
              className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:border-red-200"
            >
              <FileText className="h-4 w-4 mr-2" />
              Generar Reportes
            </TabsTrigger>
            <TabsTrigger 
              value="consolidados"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Consolidados
            </TabsTrigger>
            <TabsTrigger 
              value="analisis"
              className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-green-200"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Análisis
            </TabsTrigger>
            <TabsTrigger 
              value="historial"
              className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:border-purple-200"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generador" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Generador de Reportes</h2>
                <p className="text-gray-600">Crea reportes personalizados en PDF y Excel</p>
              </div>
              <div className="flex gap-2">
                <FiltrosReportes />
              </div>
            </div>
            
            <GeneradorReportes onMensaje={mostrarMensaje} />
          </TabsContent>

          <TabsContent value="consolidados" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Reportes Consolidados</h2>
                <p className="text-gray-600">Informes que combinan datos de múltiples módulos</p>
              </div>
            </div>
            
            <ReportesConsolidados onMensaje={mostrarMensaje} />
          </TabsContent>

          <TabsContent value="analisis" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Análisis y Gráficos</h2>
                <p className="text-gray-600">Visualizaciones y análisis estadísticos de tus datos</p>
              </div>
            </div>

            {/* Grid de tarjetas de análisis */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-blue-600" />
                    Distribución de Gastos
                  </CardTitle>
                  <CardDescription>Análisis por categorías y proyectos</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Visualiza cómo se distribuyen los gastos entre diferentes categorías y proyectos.
                  </p>
                  <Button className="w-full" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Ver Análisis
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Tendencias de Pagos
                  </CardTitle>
                  <CardDescription>Evolución temporal de pagos</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Analiza las tendencias de pagos a trabajadores a lo largo del tiempo.
                  </p>
                  <Button className="w-full" variant="outline">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Ver Tendencias
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-orange-600" />
                    Estado de Proyectos
                  </CardTitle>
                  <CardDescription>Avance y consolidación por proyecto</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Estado actual y progreso de todos los proyectos en el sistema.
                  </p>
                  <Button className="w-full" variant="outline">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Ver Estado
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-purple-600" />
                    Cobertura de Evidencias
                  </CardTitle>
                  <CardDescription>Análisis de documentación</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Evalúa qué tan bien documentados están tus proyectos.
                  </p>
                  <Button className="w-full" variant="outline">
                    <Camera className="h-4 w-4 mr-2" />
                    Ver Cobertura
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                    Eficiencia Presupuestal
                  </CardTitle>
                  <CardDescription>Análisis de ejecución presupuestal</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Compara presupuesto asignado vs ejecutado por proyecto.
                  </p>
                  <Button className="w-full" variant="outline">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Ver Eficiencia
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-indigo-600" />
                    Análisis de Trabajadores
                  </CardTitle>
                  <CardDescription>Pagos y productividad por trabajador</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Estadísticas de pagos y horas trabajadas por cada trabajador.
                  </p>
                  <Button className="w-full" variant="outline">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Ver Análisis
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="historial" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Historial de Reportes</h2>
                <p className="text-gray-600">Reportes generados anteriormente</p>
              </div>
            </div>
            
            <HistorialReportes />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
