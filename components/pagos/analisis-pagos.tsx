"use client"

import { useEffect, useState } from "react"
import { Bar, Pie } from "react-chartjs-2"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { usePagosUpdate } from "@/components/pagos/pagos-update-context"
import { formatCOP } from "@/lib/format-cop"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from "chart.js"

// Registro de componentes de ChartJS
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement)

// Paleta de colores institucionales para pagos
const coloresTipoLabor = [
  "#e11d48", // rojo institucional
  "#ffd700", // dorado
  "#2563eb", // azul fuerte
  "#059669", // verde brillante
  "#f59e42", // naranja brillante
  "#a21caf", // morado
  "#0ea5e9", // azul celeste
  "#f472b6", // rosa
]

const borderColorsTipoLabor = coloresTipoLabor.map(color => color + "80") // Agregar transparencia

// Colores para proyectos
const coloresProyecto = [
  "#111827", "#e11d48", "#2563eb", "#059669", "#f59e42", "#a21caf", "#0ea5e9", "#f472b6",
  "#f87171", "#6366f1", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#84cc16"
]

function AnalisisPagos() {
  const { user } = useAuth()
  const { lastUpdate } = usePagosUpdate()
  const [pagos, setPagos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [proyectosMap, setProyectosMap] = useState<Record<string, string>>({})
  const [trabajadoresMap, setTrabajadoresMap] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user) fetchPagos()
    // eslint-disable-next-line
  }, [user, lastUpdate])

  const fetchPagos = async () => {
    setLoading(true)
    
    // Obtener proyectos del usuario
    let queryProyectos = supabase.from("proyectos").select("id, nombre")
    if (user?.rol === "supervisor") {
      queryProyectos = queryProyectos.eq("supervisor_id", user.id)
    }
    
    const { data: proyectos } = await queryProyectos
    
    if (!proyectos || proyectos.length === 0) {
      setPagos([])
      setProyectosMap({})
      setTrabajadoresMap({})
      setLoading(false)
      return
    }

    const proyectoIds = proyectos.map((p: any) => p.id)
    
    // Crear mapa de proyectos
    const proyectosMapData = proyectos.reduce((acc: any, p: any) => {
      acc[p.id] = p.nombre
      return acc
    }, {})
    setProyectosMap(proyectosMapData)

    // Obtener trabajadores
    const { data: trabajadores } = await supabase
      .from("trabajadores")
      .select("id, nombre")

    const trabajadoresMapData = (trabajadores || []).reduce((acc: any, t: any) => {
      acc[t.id] = t.nombre
      return acc
    }, {})
    setTrabajadoresMap(trabajadoresMapData)

    // Obtener pagos
    const { data: pagosData } = await supabase
      .from("pagos_personal")
      .select("*")
      .in("proyecto_id", proyectoIds)

    setPagos(pagosData || [])
    setLoading(false)
  }

  // Agrupar por tipo de labor
  const pagosPorTipoLabor = pagos.reduce((acc, pago) => {
    const tipo = pago.tipo_labor || "Sin especificar"
    acc[tipo] = (acc[tipo] || 0) + Number(pago.valor_pactado)
    return acc
  }, {} as Record<string, number>)

  // Agrupar por proyecto
  const pagosPorProyecto = pagos.reduce((acc, pago) => {
    acc[pago.proyecto_id] = (acc[pago.proyecto_id] || 0) + Number(pago.valor_pactado)
    return acc
  }, {} as Record<string, number>)

  // Agrupar por trabajador
  const pagosPorTrabajador = pagos.reduce((acc, pago) => {
    const trabajadorNombre = trabajadoresMap[pago.trabajador_id] || "Sin especificar"
    acc[trabajadorNombre] = (acc[trabajadorNombre] || 0) + Number(pago.valor_pactado)
    return acc
  }, {} as Record<string, number>)

  // Agrupar por mes
  const pagosPorMes = pagos.reduce((acc, pago) => {
    const mes = pago.fecha_actividad?.slice(0, 7) || "Sin fecha"
    acc[mes] = (acc[mes] || 0) + Number(pago.valor_pactado)
    return acc
  }, {} as Record<string, number>)

  // Opciones para gráficos de pastel
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

  // Datos para gráfico de tipo de labor
  const pieTipoLaborData = {
    labels: Object.keys(pagosPorTipoLabor).map(tipo => {
      const tipos: Record<string, string> = {
        "docencia": "👨‍🏫 Docencia",
        "coordinacion": "👥 Coordinación",
        "produccion": "🎬 Producción",
        "logistica": "📋 Logística",
        "tecnico": "🔧 Técnico",
        "artistico": "🎨 Artístico",
        "otros": "📌 Otros"
      }
      return tipos[tipo] || `📌 ${tipo}`
    }),
    datasets: [
      {
        data: Object.values(pagosPorTipoLabor),
        backgroundColor: coloresTipoLabor,
        borderColor: borderColorsTipoLabor,
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  }

  // Datos para gráfico por proyecto
  const pieProyectoData = {
    labels: Object.keys(pagosPorProyecto).map(id => proyectosMap[id] || id),
    datasets: [
      {
        data: Object.values(pagosPorProyecto),
        backgroundColor: coloresProyecto,
        borderColor: coloresProyecto.map(color => color + "80"),
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  }
  // Datos para gráfico de trabajadores (top 10)
  const topTrabajadores = Object.entries(pagosPorTrabajador)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10)

  const barTrabajadoresData = {
    labels: topTrabajadores.map(([nombre]) => nombre.length > 15 ? nombre.substring(0, 15) + "..." : nombre),
    datasets: [
      {
        label: "Pagos por Trabajador",
        data: topTrabajadores.map(([, valor]) => valor),
        backgroundColor: coloresProyecto.slice(0, 10),
        borderRadius: 8,
        barPercentage: 0.7,
      },
    ],
  }

  // Histograma por mes
  const year = new Date().getFullYear()
  const meses = Array.from({ length: 12 }, (_, i) => `${year}-${(i + 1).toString().padStart(2, "0")}`)
  const mesesLabels = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ]

  const barMesData = {
    labels: mesesLabels,
    datasets: [
      {
        label: "Pagos por Mes",
        data: meses.map(mes => pagosPorMes[mes] || 0),
        backgroundColor: "#e11d48",
        borderRadius: 8,
        barPercentage: 0.6,
      },
    ],
  }

  const barOptions = {
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
    scales: {
      x: {
        grid: { display: false },
        ticks: { 
          color: "#64748b", 
          font: { size: 12, weight: "bold" as const }
        },
      },
      y: {
        grid: { color: "#f1f5f9" },
        ticks: {
          color: "#64748b",
          font: { size: 12, weight: "bold" as const },
          callback: (value: any) => formatCOP(value),
        },
      },
    },
  }

  if (loading) {
    return <div className="flex justify-center items-center py-12 text-gray-500 animate-pulse"><span>Cargando análisis...</span></div>
  }

  if (pagos.length === 0) {
    return <div className="text-center py-8 text-gray-400">No hay datos suficientes para análisis.</div>
  }

  return (
    <div className="space-y-8">
      {/* Gráficos de distribución */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card className="shadow-lg border-0 bg-white/90 hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 text-center text-lg tracking-tight">Por Tipo de Labor</h3>
            <Pie data={pieTipoLaborData} options={pieOptions} />
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white/90 hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 text-center text-lg tracking-tight">Por Proyecto</h3>
            <Pie data={pieProyectoData} options={pieOptions} />
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white/90 hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 text-center text-lg tracking-tight">Top 10 Trabajadores</h3>
            <Bar data={barTrabajadoresData} options={barOptions} height={300} />
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de evolución temporal */}
      <Card className="shadow-lg border-0 bg-white/90 hover:shadow-xl transition-shadow">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4 text-center text-lg tracking-tight">Evolución de Pagos - {year}</h3>
          <Bar data={barMesData} options={barOptions} height={100} />        </CardContent>
      </Card>
    </div>
  )
}

export { AnalisisPagos }
export default AnalisisPagos
