"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DollarSign,
  BarChart3,
  Plus,
  LogOut,
  Settings,
  FolderOpen,
  Camera,
  CreditCard,
  TrendingUp,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  Users,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { ListaProyectos } from "@/components/proyectos/lista-proyectos"
import { GastosRecientes } from "@/components/gastos/gastos-recientes"
import { PagosRecientes } from "@/components/pagos/pagos-recientes"
import { EvidenciasRecientes } from "@/components/evidencias/evidencias-recientes"
import { formatCOP } from "@/lib/format-cop"

interface DashboardStats {
  proyectosActivos: number
  proyectosPlanificacion: number
  proyectosFinalizados: number
  gastosTotalMes: number
  presupuestoTotal: number
  evidenciasSubidas: number
}

export default function DashboardPage() {
  const { user, loading: authLoading, signOut, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    proyectosActivos: 0,
    proyectosPlanificacion: 0,
    proyectosFinalizados: 0,
    gastosTotalMes: 0,
    presupuestoTotal: 0,
    evidenciasSubidas: 0,
  })
  const router = useRouter()

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        setRedirecting(true)
        router.replace("/login")
        return
      }

      if (user) {
        fetchDashboardData()
      }
    }
  }, [user, authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!authLoading && user) {
      let visibilityTimeout: NodeJS.Timeout | null = null
      let lastFetch = 0
      const handleVisibility = () => {
        // Evitar múltiples llamadas seguidas
        const now = Date.now()
        if (now - lastFetch < 1000) return
        lastFetch = now
        if (document.visibilityState === "visible") {
          setLoading(true)
          fetchDashboardData().finally(() => setLoading(false))
        }
      }
      document.addEventListener("visibilitychange", handleVisibility)
      return () => {
        document.removeEventListener("visibilitychange", handleVisibility)
        if (visibilityTimeout) clearTimeout(visibilityTimeout)
      }
    }
  }, [authLoading, user])

  const fetchDashboardData = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      console.log('📊 Cargando datos del dashboard...')

      // Consulta optimizada: obtener proyectos con información relacionada
      const { data: proyectosData, error: proyectosError } = await supabase
        .from("proyectos")
        .select(`
          *,
          gastos_proyecto!inner (
            monto,
            fecha_gasto
          ),
          evidencias_proyecto (
            id
          )
        `)
        .eq("supervisor_id", user.id)

      if (proyectosError) {
        console.error("❌ Error fetching proyectos:", proyectosError)
        // Fallback: obtener solo proyectos sin joins
        const { data: proyectosFallback, error: fallbackError } = await supabase
          .from("proyectos")
          .select("*")
          .eq("supervisor_id", user.id)

        if (fallbackError) {
          console.error("❌ Error en fallback:", fallbackError)
          setLoading(false)
          return
        }

        // Procesar datos con fallback
        const proyectos = proyectosFallback || []
        const activos = proyectos.filter((p) => p.estado === "activo").length
        const planificacion = proyectos.filter((p) => p.estado === "planificacion").length
        const finalizados = proyectos.filter((p) => p.estado === "finalizado").length
        const presupuestoTotal = proyectos.reduce((sum, p) => sum + Number(p.presupuesto_total), 0)

        setStats({
          proyectosActivos: activos,
          proyectosPlanificacion: planificacion,
          proyectosFinalizados: finalizados,
          gastosTotalMes: 0,
          presupuestoTotal,
          evidenciasSubidas: 0,
        })
        
        setLoading(false)
        return
      }

      const proyectos = proyectosData || []
      console.log(`✅ Proyectos cargados: ${proyectos.length}`)

      // Calcular estadísticas de proyectos
      const activos = proyectos.filter((p) => p.estado === "activo").length
      const planificacion = proyectos.filter((p) => p.estado === "planificacion").length
      const finalizados = proyectos.filter((p) => p.estado === "finalizado").length
      const presupuestoTotal = proyectos.reduce((sum, p) => sum + Number(p.presupuesto_total), 0)

      // Calcular gastos del mes actual
      const inicioMes = new Date()
      inicioMes.setDate(1)
      const finMes = new Date()
      finMes.setMonth(finMes.getMonth() + 1)
      finMes.setDate(0)

      // Filtrar gastos del mes actual de los datos ya obtenidos
      let gastosTotalMes = 0
      let evidenciasSubidas = 0

      proyectos.forEach(proyecto => {
        // Contar evidencias
        if (proyecto.evidencias_proyecto) {
          evidenciasSubidas += proyecto.evidencias_proyecto.length
        }
        
        // Calcular gastos del mes
        if (proyecto.gastos_proyecto) {
          proyecto.gastos_proyecto.forEach((gasto: any) => {
            const fechaGasto = new Date(gasto.fecha_gasto)
            if (fechaGasto >= inicioMes && fechaGasto <= finMes) {
              gastosTotalMes += Number(gasto.monto)
            }
          })
        }
      })

      setStats({
        proyectosActivos: activos,
        proyectosPlanificacion: planificacion,
        proyectosFinalizados: finalizados,
        gastosTotalMes,
        presupuestoTotal,
        evidenciasSubidas,
      })

      console.log('✅ Dashboard cargado exitosamente')
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
  }

  // Permitir refresco externo desde ListaProyectos
  const refreshDashboard = () => {
    fetchDashboardData()
  }

  // Mostrar loading mientras se verifica autenticación o se redirige
  if (authLoading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">{redirecting ? "Redirigiendo..." : "Verificando sesión..."}</p>
        </div>
      </div>
    )
  }

  // Si no está autenticado, no mostrar contenido
  if (!user) {
    return null
  }

  const getRoleColor = (rol: string) => {
    switch (rol) {
      case "supervisor":
        return "bg-red-100 text-red-800"
      case "admin":
        return "bg-orange-100 text-orange-800"
      case "president":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleName = (rol: string) => {
    switch (rol) {
      case "supervisor":
        return "Supervisor"
      case "admin":
        return "Administradora"
      case "president":
        return "Presidencia"
      default:
        return "Usuario"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Image
              src="/images/logo-ccc.png"
              alt="Corporación Cultural Cúcuta"
              width={40}
              height={40}
              className="rounded-full"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">SiGeCul</h1>
              <p className="text-sm text-gray-600">Panel de Supervisor</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-semibold text-gray-900">{user.nombre}</p>
              <Badge className={getRoleColor(user.rol)}>{getRoleName(user.rol)}</Badge>
            </div>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Planificación</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.proyectosPlanificacion}</div>
              <p className="text-xs text-muted-foreground">Proyectos por iniciar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos</CardTitle>
              <FolderOpen className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.proyectosActivos}</div>
              <p className="text-xs text-muted-foreground">En ejecución</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Finalizados</CardTitle>
              <CheckCircle className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.proyectosFinalizados}</div>
              <p className="text-xs text-muted-foreground">Completados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Presupuesto Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCOP(stats.presupuestoTotal)}</div>
              <p className="text-xs text-muted-foreground">Asignado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gastos del Mes</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCOP(stats.gastosTotalMes)}</div>
              <p className="text-xs text-muted-foreground">Ejecutado este mes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Evidencias</CardTitle>
              <Camera className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.evidenciasSubidas}</div>
              <p className="text-xs text-muted-foreground">Archivos subidos</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de contenido */}
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger 
              value="projects" 
              className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-green-200"
            >
              Proyectos
            </TabsTrigger>
            <TabsTrigger 
              value="expenses"
              className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:border-orange-200"
            >
              Gastos
            </TabsTrigger>
            <TabsTrigger 
              value="payments"
              className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:border-red-200"
            >
              Pagos
            </TabsTrigger>
            <TabsTrigger 
              value="evidence"
              className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:border-purple-200"
            >
              Evidencias
            </TabsTrigger>
            <TabsTrigger 
              value="reports"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
            >
              Reportes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Mis Proyectos</h2>
                <p className="text-gray-600">Gestiona los proyectos bajo tu supervisión</p>
              </div>
              <div className="flex gap-2">
                {/* Botón de actualizar proyectos y dashboard */}
                <Link href="/dashboard/proyectos/crear">
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Proyecto
                  </Button>
                </Link>
              </div>
            </div>

            {/* Explicación de Estados */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg text-blue-900">Estados de Proyectos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="font-semibold text-blue-700">Planificación</p>
                      <p className="text-blue-600">Proyecto aprobado, preparando inicio</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="font-semibold text-green-700">Activo</p>
                      <p className="text-green-600">En ejecución, actividades en curso</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-semibold text-gray-700">Finalizado</p>
                      <p className="text-gray-600">Completado exitosamente</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="font-semibold text-red-700">Cancelado</p>
                      <p className="text-red-600">Cancelado por problemas</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de proyectos, pasar prop para refrescar dashboard */}
            <ListaProyectos onRefreshDashboard={refreshDashboard} />
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Control de Gastos</h2>
                <p className="text-gray-600">Registra y controla los gastos de tus proyectos</p>
              </div>
              <div className="flex gap-3">
                <Link href="/dashboard/gastos">
                  <Button variant="outline" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Ver Todos los Gastos
                  </Button>
                </Link>
                <Link href="/dashboard/gastos/nuevo">
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Gasto
                  </Button>
                </Link>
              </div>
            </div>

            {/* Estadísticas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gastos del Mes</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCOP(stats.gastosTotalMes)}</div>
                  <p className="text-xs text-muted-foreground">Ejecutado este mes</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {formatCOP(stats.presupuestoTotal - stats.gastosTotalMes)}
                  </div>
                  <p className="text-xs text-muted-foreground">Por aprobar</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Disponible</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCOP(stats.presupuestoTotal - stats.gastosTotalMes)}
                  </div>
                  <p className="text-xs text-muted-foreground">Presupuesto restante</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
                  <FolderOpen className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.proyectosActivos}</div>
                  <p className="text-xs text-muted-foreground">Con gastos registrados</p>
                </CardContent>
              </Card>
            </div>

            {/* Gastos Recientes */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Gastos Recientes</CardTitle>
                    <CardDescription>Últimos gastos registrados en tus proyectos</CardDescription>
                  </div>
                  <Link href="/dashboard/gastos">
                    <Button variant="outline" size="sm">
                      Ver Todos
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <GastosRecientes />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Control de Pagos</h2>
                <p className="text-gray-600">Gestiona pagos a trabajadores temporales</p>
              </div>
              <div className="flex gap-3">
                <Link href="/dashboard/pagos">
                  <Button variant="outline" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Ver Todos los Pagos
                  </Button>
                </Link>
                <Link href="/dashboard/pagos/nuevo-pago">
                  <Button className="bg-red-600 hover:bg-red-700">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Registrar Pago
                  </Button>
                </Link>
              </div>
            </div>

            {/* Estadísticas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pagos del Mes</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCOP(stats.gastosTotalMes)}</div>
                  <p className="text-xs text-muted-foreground">Pagos este mes</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {formatCOP(stats.presupuestoTotal - stats.gastosTotalMes)}
                  </div>
                  <p className="text-xs text-muted-foreground">Por pagar</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Trabajadores Activos</CardTitle>
                  <Users className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.proyectosActivos}</div>
                  <p className="text-xs text-muted-foreground">Con pagos registrados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Proyectos con Pagos</CardTitle>
                  <FolderOpen className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.proyectosActivos}</div>
                  <p className="text-xs text-muted-foreground">Proyectos activos</p>
                </CardContent>
              </Card>
            </div>

            {/* Pagos Recientes */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Pagos Recientes</CardTitle>
                    <CardDescription>Últimos pagos registrados a trabajadores</CardDescription>
                  </div>
                  <Link href="/dashboard/pagos">
                    <Button variant="outline" size="sm">
                      Ver Todos
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <PagosRecientes />
              </CardContent>
            </Card>

            {/* Acciones Rápidas */}
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/dashboard/pagos">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-red-600" />
                        Ver Todos los Pagos
                      </CardTitle>
                      <CardDescription>Gestiona todos los pagos de tus proyectos</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        Accede al sistema completo de control de pagos con filtros, estadísticas y gestión avanzada.
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/dashboard/pagos/nuevo-pago">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5 text-green-600" />
                        Registrar Pago
                      </CardTitle>
                      <CardDescription>Añade un nuevo pago a trabajadores</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        Registra pagos por servicios, honorarios, consultorías y más con comprobantes digitales.
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Card className="border-dashed border-2 border-gray-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-500">
                      <BarChart3 className="h-5 w-5" />
                      Reportes de Pagos
                    </CardTitle>
                    <CardDescription>Próximamente</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      Genera reportes automáticos y análisis detallados de tus pagos por proyecto.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="evidence" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Evidencias Digitales</h2>
                <p className="text-gray-600">Organiza fotografías y documentos de actividades</p>
              </div>
              <div className="flex gap-3">
                <Link href="/dashboard/evidencias">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Ver Todas las Evidencias
                  </Button>
                </Link>
                <Link href="/dashboard/evidencias/nuevo">
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Camera className="h-4 w-4 mr-2" />
                    Subir Evidencia
                  </Button>
                </Link>
              </div>
            </div>

            {/* Estadísticas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Evidencias</CardTitle>
                  <Camera className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{stats.evidenciasSubidas}</div>
                  <p className="text-xs text-muted-foreground">Archivos subidos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Proyectos con Evidencias</CardTitle>
                  <FolderOpen className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.proyectosActivos}</div>
                  <p className="text-xs text-muted-foreground">Con archivos subidos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(stats.evidenciasSubidas * 0.3)}
                  </div>
                  <p className="text-xs text-muted-foreground">Evidencias subidas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Galería</CardTitle>
                  <CheckCircle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(stats.evidenciasSubidas * 0.7)}
                  </div>
                  <p className="text-xs text-muted-foreground">Imágenes disponibles</p>
                </CardContent>
              </Card>
            </div>

            {/* Evidencias Recientes */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Evidencias Recientes</CardTitle>
                    <CardDescription>Últimos archivos subidos de tus proyectos</CardDescription>
                  </div>
                  <Link href="/dashboard/evidencias">
                    <Button variant="outline" size="sm">
                      Ver Todas
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <EvidenciasRecientes />
              </CardContent>
            </Card>

            {/* Acciones Rápidas */}
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/dashboard/evidencias">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5 text-purple-600" />
                        Ver Todas las Evidencias
                      </CardTitle>
                      <CardDescription>Gestiona todas las evidencias de tus proyectos</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        Accede al sistema completo de gestión de evidencias con filtros, organización y visualización.
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/dashboard/evidencias/nuevo">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5 text-green-600" />
                        Subir Evidencia
                      </CardTitle>
                      <CardDescription>Añade fotografías y documentos</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        Sube imágenes, videos, documentos y archivos de audio como evidencia de actividades.
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Card className="border-dashed border-2 border-gray-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-500">
                      <BarChart3 className="h-5 w-5" />
                      Galería Visual
                    </CardTitle>
                    <CardDescription>Próximamente</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      Visualiza todas tus evidencias en una galería interactiva y organizada.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Reportes y Análisis</h2>
                <p className="text-gray-600">Genera informes de tus proyectos</p>
              </div>
              <Button className="bg-red-600 hover:bg-red-700">
                <BarChart3 className="h-4 w-4 mr-2" />
                Generar Reporte
              </Button>
            </div>
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Próximamente</CardTitle>
                  <CardDescription>Reportes automáticos del sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">Funcionalidad en desarrollo...</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
