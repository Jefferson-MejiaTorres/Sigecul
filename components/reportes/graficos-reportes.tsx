"use client"

import React from "react"
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  LineElement,
  PointElement,
} from 'chart.js'
import { Pie, Bar, Line } from 'react-chartjs-2'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Registrar componentes de Chart.js
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  LineElement,
  PointElement
)

interface GraficoProyectosPorEstadoProps {
  datos: Array<{
    estado: string
    cantidad: number
    porcentaje: number
  }>
}

interface GraficoGastosPorCategoriaProps {
  datos: Array<{
    categoria: string
    total: number
    porcentaje: number
  }>
}

interface GraficoTendenciaMensualProps {
  datos: Array<{
    mes: string
    gastos: number
    pagos: number
  }>
}

export function GraficoProyectosPorEstado({ datos }: GraficoProyectosPorEstadoProps) {
  const coloresEstado = {
    'activo': '#10b981',      // green-500
    'planificacion': '#3b82f6', // blue-500  
    'finalizado': '#6b7280',    // gray-500
    'cancelado': '#ef4444'      // red-500
  }

  const data = {
    labels: datos.map(item => 
      item.estado.charAt(0).toUpperCase() + item.estado.slice(1)
    ),
    datasets: [
      {
        data: datos.map(item => item.cantidad),
        backgroundColor: datos.map(item => 
          coloresEstado[item.estado as keyof typeof coloresEstado] || '#6b7280'
        ),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const item = datos[context.dataIndex]
            return `${context.label}: ${item.cantidad} (${item.porcentaje}%)`
          }
        }
      }
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Proyectos por Estado</CardTitle>
        <CardDescription>Distribución actual de proyectos</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ height: '250px' }}>
          <Pie data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  )
}

export function GraficoGastosPorCategoria({ datos }: GraficoGastosPorCategoriaProps) {
  const data = {
    labels: datos.map(item => item.categoria),
    datasets: [
      {
        label: 'Gastos ($)',
        data: datos.map(item => item.total),
        backgroundColor: [
          '#e11d48', // red-600 (color principal)
          '#dc2626', // red-600 variant
          '#b91c1c', // red-700
          '#991b1b', // red-800
          '#7f1d1d', // red-900
        ],
        borderWidth: 1,
        borderColor: '#ffffff',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const item = datos[context.dataIndex]
            return `${context.dataset.label}: $${item.total.toLocaleString()} (${item.porcentaje}%)`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '$' + value.toLocaleString()
          }
        }
      }
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Gastos por Categoría</CardTitle>
        <CardDescription>Distribución del presupuesto ejecutado</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ height: '250px' }}>
          <Bar data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  )
}

export function GraficoTendenciaMensual({ datos }: GraficoTendenciaMensualProps) {
  const data = {
    labels: datos.map(item => item.mes),
    datasets: [
      {
        label: 'Gastos',
        data: datos.map(item => item.gastos),
        borderColor: '#e11d48',
        backgroundColor: '#fecaca',
        tension: 0.1,
        fill: false,
      },
      {
        label: 'Pagos',
        data: datos.map(item => item.pagos),
        borderColor: '#059669',
        backgroundColor: '#a7f3d0',
        tension: 0.1,
        fill: false,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: $${context.raw.toLocaleString()}`
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Meses'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Monto ($)'
        },
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '$' + value.toLocaleString()
          }
        }
      }
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Tendencia Mensual</CardTitle>
        <CardDescription>Evolución de gastos y pagos en el tiempo</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ height: '250px' }}>
          <Line data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  )
}

export function GraficoResumenFinanciero({ 
  totalPresupuesto, 
  totalEjecutado, 
  porcentajeEjecucion 
}: { 
  totalPresupuesto: number
  totalEjecutado: number 
  porcentajeEjecucion: number
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Ejecución Presupuestal</CardTitle>
        <CardDescription>Estado actual del presupuesto</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Ejecutado</span>
            <span className="font-medium">{porcentajeEjecucion}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-red-600 h-3 rounded-full transition-all duration-300" 
              style={{ width: `${porcentajeEjecucion}%` }}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              ${totalPresupuesto.toLocaleString()}
            </p>
            <p className="text-xs text-gray-600">Presupuesto Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              ${totalEjecutado.toLocaleString()}
            </p>
            <p className="text-xs text-gray-600">Ejecutado</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
