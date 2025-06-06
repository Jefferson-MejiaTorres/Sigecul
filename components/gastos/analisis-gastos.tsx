"use client"
import { useEffect, useState } from "react"
import { Bar, Pie } from "react-chartjs-2"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useGastosUpdate } from "@/components/gastos/gastos-update-context"
import { formatCOP } from "@/lib/format-cop"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from "chart.js"

// Registro de componentes de ChartJS
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement)

// Paleta minimalista y moderna para el primer gráfico (por tipo de gasto)
const coloresTipo = [
  "#e11d48", // rojo institucional (igual que botones y branding)
  "#ffd700", // dorado
  "#2563eb", // azul
  "#64748b", // gris
  "#fbbf24", // amarillo
  "#a21caf", // morado
  "#059669", // verde
  "#f1f5f9", // gris claro
]
const borderColorsTipo = coloresTipo.map(c => c + "cc")

// Paleta diferente para el gráfico de proyectos
const coloresProyecto = [
  "#6366f1", // azul violeta
  "#f59e42", // naranja
  "#10b981", // verde esmeralda
  "#eab308", // amarillo dorado
  "#f472b6", // rosa
  "#0ea5e9", // azul celeste
  "#a3e635", // verde lima
  "#f87171", // rojo coral
]
const borderColorsProyecto = coloresProyecto.map(c => c + "cc")

// Paleta para líneas de proyectos (negros y colores brillantes, sin repetir)
const coloresLineasProyecto = [
  "#111827", // negro intenso
  "#e11d48", // rojo institucional
  "#f59e42", // naranja brillante
  "#2563eb", // azul fuerte
  "#fbbf24", // amarillo brillante
  "#059669", // verde brillante
  "#a21caf", // morado
  "#0ea5e9", // azul celeste
  "#f472b6", // rosa
  "#f87171", // rojo coral
  "#fff",     // blanco
  "#6366f1", // azul violeta
]

export function AnalisisGastos() {
  const { user } = useAuth()
  const { lastUpdate } = useGastosUpdate()
  const [gastos, setGastos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [proyectosMap, setProyectosMap] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user) fetchGastos()
    // eslint-disable-next-line
  }, [user, lastUpdate])

  const fetchGastos = async () => {
    setLoading(true)
    const { data: proyectos } = await supabase.from("proyectos").select("id, nombre").eq("supervisor_id", user?.id)
    if (!proyectos || proyectos.length === 0) {
      setGastos([])
      setProyectosMap({})
      setLoading(false)
      return
    }
    const proyectoIds = proyectos.map((p: any) => p.id)
    // Crear un mapa id -> nombre para mostrar nombres en el gráfico
    const map: Record<string, string> = {}
    proyectos.forEach((p: any) => { map[p.id] = p.nombre })
    setProyectosMap(map)
    const { data: gastosData } = await supabase.from("gastos_proyecto").select("*", { count: "exact" }).in("proyecto_id", proyectoIds)
    setGastos(gastosData || [])
    setLoading(false)
  }

  // Agrupar por tipo
  const gastosPorTipo = gastos.reduce((acc, gasto) => {
    acc[gasto.tipo_gasto] = (acc[gasto.tipo_gasto] || 0) + Number(gasto.monto)
    return acc
  }, {} as Record<string, number>)

  // Agrupar por proyecto
  const gastosPorProyecto = gastos.reduce((acc, gasto) => {
    acc[gasto.proyecto_id] = (acc[gasto.proyecto_id] || 0) + Number(gasto.monto)
    return acc
  }, {} as Record<string, number>)

  // Agrupar por mes
  const gastosPorMes = gastos.reduce((acc, gasto) => {
    const mes = gasto.fecha_gasto?.slice(0, 7) || "Sin fecha"
    acc[mes] = (acc[mes] || 0) + Number(gasto.monto)
    return acc
  }, {} as Record<string, number>)

  if (loading) {
    return <div className="flex justify-center items-center py-12 text-gray-500 animate-pulse"><span>Cargando análisis...</span></div>
  }
  if (gastos.length === 0) {
    return <div className="text-center py-8 text-gray-400">No hay datos suficientes para análisis.</div>
  }

  // Opciones minimalistas para gráficos de pastel
  const pieOptions = {
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "#1e293b",
          font: { size: 14, family: "inherit" },
          boxWidth: 18,
          padding: 18,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.label}: ${formatCOP(ctx.parsed)}`,
        },
        backgroundColor: "#fff",
        titleColor: "#e11d48",
        bodyColor: "#1e293b",
        borderColor: "#e11d48",
        borderWidth: 1,
      },
    },
  }

  // Pie: Distribución por tipo
  const pieTipoData = {
    labels: Object.keys(gastosPorTipo),
    datasets: [
      {
        data: Object.values(gastosPorTipo),
        backgroundColor: coloresTipo,
        borderColor: borderColorsTipo,
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  }

  // Pie: Distribución por proyecto
  const pieProyectoData = {
    labels: Object.keys(gastosPorProyecto).map(id => proyectosMap[id] || id),
    datasets: [
      {
        data: Object.values(gastosPorProyecto),
        backgroundColor: coloresProyecto,
        borderColor: borderColorsProyecto,
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  }

  // Histograma: Suma total de gastos por mes en el año actual
  const year = new Date().getFullYear()
  // Obtener todos los meses del año actual
  const meses = Array.from({ length: 12 }, (_, i) => `${year}-${(i + 1).toString().padStart(2, "0")}`)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <Card className="shadow-lg border-0 bg-white/90 hover:shadow-xl transition-shadow">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4 text-center text-lg tracking-tight">Por Tipo de Gasto</h3>
          <Pie data={pieTipoData} options={pieOptions} />
        </CardContent>
      </Card>
      <Card className="shadow-lg border-0 bg-white/90 hover:shadow-xl transition-shadow flex flex-col items-center justify-center">
        <CardContent className="p-0 w-full flex flex-col items-center justify-center">
          <div className="flex flex-col items-center w-full">
            <h3 className="font-semibold text-gray-900 mb-1 text-center text-lg tracking-tight">Gastos por Proyecto (Mes Actual)</h3>
            <p className="text-center text-gray-500 text-sm mb-2">Suma total de gastos por proyecto en {new Date().toLocaleString('es-CO', { month: 'long', year: 'numeric' })}</p>
            <div className="w-full flex justify-center">
              <div className="w-full md:w-[98%] lg:w-[95%] xl:w-[90%] mx-auto">
                <Bar
                  data={{
                    labels: Object.values(proyectosMap),
                    datasets: [
                      {
                        label: "Gasto total",
                        data: Object.keys(proyectosMap).map(proyectoId => {
                          const hoy = new Date()
                          const mesActual = hoy.toISOString().slice(0, 7)
                          return gastos.filter(g => g.proyecto_id === proyectoId && g.fecha_gasto?.startsWith(mesActual)).reduce((sum, g) => sum + Number(g.monto), 0)
                        }),
                        backgroundColor: Object.keys(proyectosMap).map((_, idx) => coloresProyecto[idx % coloresProyecto.length]),
                        borderRadius: 10,
                        barPercentage: 0.6,
                        categoryPercentage: 0.7,
                        borderSkipped: false,
                      },
                    ],
                  }}
                  options={{
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (ctx: any) => formatCOP(ctx.parsed.y),
                        },
                        backgroundColor: "#fff",
                        titleColor: "#e11d48",
                        bodyColor: "#1e293b",
                        borderColor: "#e11d48",
                        borderWidth: 1,
                      },
                    },
                    layout: {
                      padding: { left: 8, right: 8, top: 8, bottom: 8 },
                    },
                    scales: {
                      x: {
                        grid: { display: false },
                        ticks: { color: "#64748b", font: { size: 14, family: "inherit", weight: "bold" as const }, padding: 6 },
                        title: { display: false },
                      },
                      y: {
                        grid: { color: "#f1f5f9" },
                        ticks: {
                          color: "#64748b",
                          font: { size: 14, family: "inherit", weight: "bold" as const },
                          callback: (v: any) => formatCOP(v),
                          padding: 6,
                        },
                        title: { display: false },
                      },
                    },
                  }}
                  height={320}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-lg border-0 bg-white/90 hover:shadow-xl transition-shadow">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4 text-center text-lg tracking-tight">Por Proyecto</h3>
          <Pie data={pieProyectoData} options={pieOptions} />
        </CardContent>
      </Card>
    </div>
  )
}
