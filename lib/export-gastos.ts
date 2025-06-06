// Utilidades para exportar gastos a diferentes formatos con soporte para Excel profesional y PDF corporativo
import { supabase } from "@/lib/supabase"
import { formatCOP } from "@/lib/format-cop"
import type { GastoProyecto, Proyecto } from "@/lib/types"
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface GastoConProyecto extends GastoProyecto {
  proyecto?: Proyecto
}

interface OpcionesExportacion {
  formato: 'csv' | 'excel' | 'pdf'
  incluirResumen?: boolean
  filtros?: {
    fechaInicio?: string
    fechaFin?: string
    proyecto?: string
    tipo?: string
    estado?: string
  }
}

export async function obtenerGastosParaExportacion(userId: string): Promise<GastoConProyecto[]> {
  try {
    // Obtener proyectos del supervisor
    const { data: proyectos, error: proyectosError } = await supabase
      .from("proyectos")
      .select("*")
      .eq("supervisor_id", userId)

    if (proyectosError) {
      throw proyectosError
    }

    if (!proyectos || proyectos.length === 0) {
      return []
    }

    const proyectoIds = proyectos.map((p) => p.id)

    // Obtener todos los gastos de esos proyectos
    const { data: gastos, error: gastosError } = await supabase
      .from("gastos_proyecto")
      .select("*")
      .in("proyecto_id", proyectoIds)
      .order("fecha_gasto", { ascending: false })

    if (gastosError) {
      throw gastosError
    }

    // Combinar gastos con información del proyecto
    const gastosConProyecto: GastoConProyecto[] = gastos?.map((gasto) => ({
      ...gasto,
      proyecto: proyectos.find((p) => p.id === gasto.proyecto_id),
    })) || []

    return gastosConProyecto
  } catch (error) {
    console.error("Error al obtener gastos para exportación:", error)
    throw error
  }
}

export function convertirGastosACSV(gastos: GastoConProyecto[]): string {
  // Definir las columnas del CSV con nombres más profesionales
  const columnas = [
    "CÓDIGO PROYECTO",
    "NOMBRE DEL PROYECTO", 
    "CATEGORÍA DEL GASTO",
    "DESCRIPCIÓN DETALLADA",
    "VALOR NUMÉRICO",
    "VALOR FORMATEADO (COP)",
    "FECHA DE EJECUCIÓN",
    "RESPONSABLE/EJECUTOR",
    "ESTADO DE APROBACIÓN",
    "OBSERVACIONES ADICIONALES",
    "FECHA DE REGISTRO EN SISTEMA",
    "MES DE EJECUCIÓN",
    "AÑO DE EJECUCIÓN",
    "TRIMESTRE",
    "DÍA DE LA SEMANA"
  ]

  // Función para escapar valores CSV
  const escaparCSV = (valor: any): string => {
    if (valor === null || valor === undefined) return ""
    const str = String(valor)
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  // Función para obtener el label del tipo de gasto
  const getTipoGastoLabel = (tipo: string) => {
    const tipos = {
      honorarios: "HONORARIOS PROFESIONALES",
      refrigerios: "REFRIGERIOS Y ALIMENTACIÓN",
      transporte: "TRANSPORTE Y MOVILIZACIÓN",
      materiales: "MATERIALES Y SUMINISTROS",
      servicios: "SERVICIOS PROFESIONALES",
      otros: "OTROS GASTOS",
    }
    return tipos[tipo as keyof typeof tipos] || tipo.toUpperCase()
  }

  // Función para obtener información de fecha
  const obtenerInfoFecha = (fecha: string) => {
    const date = new Date(fecha)
    const meses = [
      "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
      "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
    ]
    const diasSemana = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"]
    
    return {
      mes: meses[date.getMonth()],
      año: date.getFullYear().toString(),
      trimestre: `Q${Math.ceil((date.getMonth() + 1) / 3)}`,
      diaSemana: diasSemana[date.getDay()]
    }
  }

  // Crear las filas del CSV con información más completa
  const filas = gastos.map((gasto) => {
    const infoFecha = obtenerInfoFecha(gasto.fecha_gasto)
    const infoRegistro = obtenerInfoFecha(gasto.created_at)
    
    return [
      escaparCSV(gasto.proyecto?.id || "N/A"),
      escaparCSV(gasto.proyecto?.nombre || "PROYECTO NO ENCONTRADO"),
      escaparCSV(getTipoGastoLabel(gasto.tipo_gasto)),
      escaparCSV(gasto.descripcion),
      escaparCSV(gasto.monto),
      escaparCSV(formatCOP(gasto.monto)),
      escaparCSV(new Date(gasto.fecha_gasto).toLocaleDateString("es-CO", { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })),
      escaparCSV(gasto.responsable || "SIN ESPECIFICAR"),
      escaparCSV(gasto.aprobado ? "✅ APROBADO" : "⏳ PENDIENTE DE APROBACIÓN"),
      escaparCSV(gasto.observaciones || "SIN OBSERVACIONES"),
      escaparCSV(new Date(gasto.created_at).toLocaleDateString("es-CO", { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })),
      escaparCSV(infoFecha.mes),
      escaparCSV(infoFecha.año),
      escaparCSV(infoFecha.trimestre),
      escaparCSV(infoFecha.diaSemana)
    ]
  })

  // Combinar encabezados y filas
  const csvContent = [columnas.join(","), ...filas.map(fila => fila.join(","))].join("\n")
  
  return csvContent
}

export function descargarCSV(csvContent: string, nombreArchivo: string = "gastos-proyectos.csv") {
  // Agregar BOM para compatibilidad con Excel
  const BOM = "\uFEFF"
  const csvContentWithBOM = BOM + csvContent

  // Crear blob con el contenido CSV
  const blob = new Blob([csvContentWithBOM], { type: "text/csv;charset=utf-8;" })
  
  // Crear enlace de descarga
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  
  link.setAttribute("href", url)
  link.setAttribute("download", nombreArchivo)
  link.style.visibility = "hidden"
  
  // Agregar al DOM, hacer click y remover
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Limpiar URL objeto
  URL.revokeObjectURL(url)
}

export function crearExcelProfesional(gastos: GastoConProyecto[], opciones: OpcionesExportacion = { formato: 'excel' }): XLSX.WorkBook {
  const wb = XLSX.utils.book_new()
  
  // Función para obtener el label del tipo de gasto
  const getTipoGastoLabel = (tipo: string) => {
    const tipos = {
      honorarios: "HONORARIOS PROFESIONALES",
      refrigerios: "REFRIGERIOS Y ALIMENTACIÓN", 
      transporte: "TRANSPORTE Y MOVILIZACIÓN",
      materiales: "MATERIALES Y SUMINISTROS",
      servicios: "SERVICIOS PROFESIONALES",
      otros: "OTROS GASTOS",
    }
    return tipos[tipo as keyof typeof tipos] || tipo.toUpperCase()
  }

  // Función para obtener información de fecha
  const obtenerInfoFecha = (fecha: string) => {
    const date = new Date(fecha)
    const meses = [
      "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
      "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
    ]
    
    return {
      mes: meses[date.getMonth()],
      año: date.getFullYear(),
      trimestre: `Q${Math.ceil((date.getMonth() + 1) / 3)}`,
      fechaFormateada: date.toLocaleDateString("es-CO", { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
  }

  // === HOJA 1: REPORTE DETALLADO ===
  const datosDetallados = gastos.map((gasto) => {
    const infoFecha = obtenerInfoFecha(gasto.fecha_gasto)
    const infoRegistro = obtenerInfoFecha(gasto.created_at)
    
    return {
      "CÓDIGO PROYECTO": gasto.proyecto?.id || "N/A",
      "NOMBRE DEL PROYECTO": gasto.proyecto?.nombre || "PROYECTO NO ENCONTRADO",
      "CATEGORÍA DEL GASTO": getTipoGastoLabel(gasto.tipo_gasto),
      "DESCRIPCIÓN DETALLADA": gasto.descripcion,
      "VALOR NUMÉRICO": Number(gasto.monto),
      "VALOR FORMATEADO (COP)": formatCOP(gasto.monto),
      "FECHA DE EJECUCIÓN": infoFecha.fechaFormateada,
      "RESPONSABLE/EJECUTOR": gasto.responsable || "SIN ESPECIFICAR",
      "ESTADO DE APROBACIÓN": gasto.aprobado ? "✅ APROBADO" : "⏳ PENDIENTE",
      "OBSERVACIONES": gasto.observaciones || "SIN OBSERVACIONES",
      "FECHA DE REGISTRO": infoRegistro.fechaFormateada,
      "MES DE EJECUCIÓN": infoFecha.mes,
      "AÑO DE EJECUCIÓN": infoFecha.año,
      "TRIMESTRE": infoFecha.trimestre
    }
  })

  const wsDetallado = XLSX.utils.json_to_sheet(datosDetallados)
  
  // Configurar ancho de columnas para mejor presentación
  const anchosColumnas = [
    { wch: 15 }, // CÓDIGO PROYECTO
    { wch: 35 }, // NOMBRE DEL PROYECTO
    { wch: 25 }, // CATEGORÍA DEL GASTO
    { wch: 40 }, // DESCRIPCIÓN DETALLADA
    { wch: 15 }, // VALOR NUMÉRICO
    { wch: 20 }, // VALOR FORMATEADO
    { wch: 25 }, // FECHA DE EJECUCIÓN
    { wch: 20 }, // RESPONSABLE/EJECUTOR
    { wch: 20 }, // ESTADO DE APROBACIÓN
    { wch: 30 }, // OBSERVACIONES
    { wch: 25 }, // FECHA DE REGISTRO
    { wch: 15 }, // MES DE EJECUCIÓN
    { wch: 10 }, // AÑO DE EJECUCIÓN
    { wch: 12 }  // TRIMESTRE
  ]
  
  wsDetallado['!cols'] = anchosColumnas
  XLSX.utils.book_append_sheet(wb, wsDetallado, "📊 REPORTE DETALLADO")

  // === HOJA 2: RESUMEN POR PROYECTO ===
  const resumenPorProyecto = gastos.reduce((acc, gasto) => {
    const proyectoId = gasto.proyecto?.id || "N/A"
    const proyectoNombre = gasto.proyecto?.nombre || "PROYECTO NO ENCONTRADO"
    
    if (!acc[proyectoId]) {
      acc[proyectoId] = {
        nombre: proyectoNombre,
        totalGastos: 0,
        cantidadGastos: 0,
        gastosAprobados: 0,
        gastosPendientes: 0,
        montoAprobado: 0,
        montoPendiente: 0
      }
    }
    
    acc[proyectoId].totalGastos += Number(gasto.monto)
    acc[proyectoId].cantidadGastos += 1
    
    if (gasto.aprobado) {
      acc[proyectoId].gastosAprobados += 1
      acc[proyectoId].montoAprobado += Number(gasto.monto)
    } else {
      acc[proyectoId].gastosPendientes += 1
      acc[proyectoId].montoPendiente += Number(gasto.monto)
    }
    
    return acc
  }, {} as Record<string, any>)

  const datosResumenProyecto = Object.entries(resumenPorProyecto).map(([id, data]) => ({
    "CÓDIGO": id,
    "NOMBRE DEL PROYECTO": data.nombre,
    "TOTAL GASTOS": formatCOP(data.totalGastos),
    "CANTIDAD DE GASTOS": data.cantidadGastos,
    "GASTOS APROBADOS": data.gastosAprobados,
    "GASTOS PENDIENTES": data.gastosPendientes,
    "MONTO APROBADO": formatCOP(data.montoAprobado),
    "MONTO PENDIENTE": formatCOP(data.montoPendiente),
    "% APROBACIÓN": data.cantidadGastos > 0 ? `${((data.gastosAprobados / data.cantidadGastos) * 100).toFixed(1)}%` : "0%"
  }))

  const wsResumenProyecto = XLSX.utils.json_to_sheet(datosResumenProyecto)
  wsResumenProyecto['!cols'] = [
    { wch: 15 }, { wch: 35 }, { wch: 18 }, { wch: 12 }, 
    { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 12 }
  ]
  XLSX.utils.book_append_sheet(wb, wsResumenProyecto, "📈 RESUMEN POR PROYECTO")

  // === HOJA 3: RESUMEN POR CATEGORÍA ===
  const resumenPorCategoria = gastos.reduce((acc, gasto) => {
    const categoria = getTipoGastoLabel(gasto.tipo_gasto)
    
    if (!acc[categoria]) {
      acc[categoria] = {
        totalGastos: 0,
        cantidadGastos: 0,
        gastosAprobados: 0,
        gastosPendientes: 0
      }
    }
    
    acc[categoria].totalGastos += Number(gasto.monto)
    acc[categoria].cantidadGastos += 1
    
    if (gasto.aprobado) {
      acc[categoria].gastosAprobados += 1
    } else {
      acc[categoria].gastosPendientes += 1
    }
    
    return acc
  }, {} as Record<string, any>)

  const datosResumenCategoria = Object.entries(resumenPorCategoria).map(([categoria, data]) => ({
    "CATEGORÍA DE GASTO": categoria,
    "TOTAL INVERTIDO": formatCOP(data.totalGastos),
    "CANTIDAD DE GASTOS": data.cantidadGastos,
    "APROBADOS": data.gastosAprobados,
    "PENDIENTES": data.gastosPendientes,
    "PROMEDIO POR GASTO": formatCOP(data.totalGastos / data.cantidadGastos),
    "% DEL TOTAL": `${((data.totalGastos / gastos.reduce((sum, g) => sum + Number(g.monto), 0)) * 100).toFixed(1)}%`
  }))

  const wsResumenCategoria = XLSX.utils.json_to_sheet(datosResumenCategoria)
  wsResumenCategoria['!cols'] = [
    { wch: 30 }, { wch: 18 }, { wch: 12 }, { wch: 10 }, 
    { wch: 10 }, { wch: 18 }, { wch: 12 }
  ]
  XLSX.utils.book_append_sheet(wb, wsResumenCategoria, "📊 RESUMEN POR CATEGORÍA")

  // === HOJA 4: ESTADÍSTICAS GENERALES ===
  const totalGeneral = gastos.reduce((sum, g) => sum + Number(g.monto), 0)
  const totalAprobado = gastos.filter(g => g.aprobado).reduce((sum, g) => sum + Number(g.monto), 0)
  const totalPendiente = gastos.filter(g => !g.aprobado).reduce((sum, g) => sum + Number(g.monto), 0)
  
  const estadisticasGenerales = [
    { "MÉTRICA": "TOTAL DE GASTOS REGISTRADOS", "VALOR": gastos.length.toString(), "DESCRIPCIÓN": "Cantidad total de gastos en el sistema" },
    { "MÉTRICA": "MONTO TOTAL INVERTIDO", "VALOR": formatCOP(totalGeneral), "DESCRIPCIÓN": "Suma total de todos los gastos" },
    { "MÉTRICA": "MONTO APROBADO", "VALOR": formatCOP(totalAprobado), "DESCRIPCIÓN": "Suma de gastos ya aprobados" },
    { "MÉTRICA": "MONTO PENDIENTE", "VALOR": formatCOP(totalPendiente), "DESCRIPCIÓN": "Suma de gastos pendientes de aprobación" },
    { "MÉTRICA": "% DE APROBACIÓN", "VALOR": `${((totalAprobado / totalGeneral) * 100).toFixed(1)}%`, "DESCRIPCIÓN": "Porcentaje de gastos aprobados vs total" },
    { "MÉTRICA": "PROMEDIO POR GASTO", "VALOR": formatCOP(totalGeneral / gastos.length), "DESCRIPCIÓN": "Valor promedio por gasto registrado" },
    { "MÉTRICA": "PROYECTOS INVOLUCRADOS", "VALOR": new Set(gastos.map(g => g.proyecto_id)).size.toString(), "DESCRIPCIÓN": "Cantidad de proyectos con gastos" },
    { "MÉTRICA": "FECHA DE GENERACIÓN", "VALOR": new Date().toLocaleDateString("es-CO", { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    }), "DESCRIPCIÓN": "Fecha y hora de generación del reporte" }
  ]

  const wsEstadisticas = XLSX.utils.json_to_sheet(estadisticasGenerales)
  wsEstadisticas['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 50 }]
  XLSX.utils.book_append_sheet(wb, wsEstadisticas, "📋 ESTADÍSTICAS GENERALES")

  return wb
}

export function descargarExcel(workbook: XLSX.WorkBook, nombreArchivo: string = "reporte-gastos-profesional.xlsx") {
  // Generar el archivo Excel
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  
  // Crear blob y descargar
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  
  link.setAttribute("href", url)
  link.setAttribute("download", nombreArchivo)
  link.style.visibility = "hidden"
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

export async function exportarGastosACSV(userId: string): Promise<void> {
  try {
    // Obtener gastos
    const gastos = await obtenerGastosParaExportacion(userId)
    
    if (gastos.length === 0) {
      throw new Error("No hay gastos para exportar")
    }

    // Convertir a CSV
    const csvContent = convertirGastosACSV(gastos)
    
    // Generar nombre del archivo con fecha actual
    const fechaActual = new Date().toISOString().split("T")[0]
    const nombreArchivo = `gastos-proyectos-${fechaActual}.csv`
    
    // Descargar archivo
    descargarCSV(csvContent, nombreArchivo)
    
  } catch (error) {
    console.error("Error al exportar gastos:", error)
    throw error
  }
}

export async function exportarGastosAExcel(userId: string, opciones: OpcionesExportacion = { formato: 'excel' }): Promise<void> {
  try {
    // Obtener gastos
    const gastos = await obtenerGastosParaExportacion(userId)
    
    if (gastos.length === 0) {
      throw new Error("No hay gastos para exportar")
    }

    // Crear workbook de Excel profesional
    const workbook = crearExcelProfesional(gastos, opciones)
    
    // Generar nombre del archivo con fecha actual
    const fechaActual = new Date().toISOString().split("T")[0]
    const nombreArchivo = `reporte-gastos-profesional-${fechaActual}.xlsx`
    
    // Descargar archivo Excel
    descargarExcel(workbook, nombreArchivo)
    
  } catch (error) {
    console.error("Error al exportar gastos a Excel:", error)
    throw error
  }
}

// === FUNCIONES PARA GENERAR PDF PROFESIONAL ===

export function crearGraficoPorCategoria(gastos: GastoConProyecto[]): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 600
  canvas.height = 400
  const ctx = canvas.getContext('2d')!

  // Fondo con degradado sutil
  const gradientBg = ctx.createLinearGradient(0, 0, 0, canvas.height)
  gradientBg.addColorStop(0, '#FAFBFC')
  gradientBg.addColorStop(1, '#F8F9FA')
  ctx.fillStyle = gradientBg
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Obtener datos por categoría con etiquetas mejoradas
  const tiposGasto: Record<string, string> = {
    alimentacion: "🍽️ Alimentación",
    refrigerios: "☕ Refrigerios", 
    transporte: "🚗 Transporte",
    materiales: "📦 Materiales",
    servicios: "⚙️ Servicios",
    otros: "📋 Otros"
  }

  const datosPorCategoria = gastos.reduce((acc, gasto) => {
    const categoria = tiposGasto[gasto.tipo_gasto] || `📌 ${gasto.tipo_gasto}`
    if (!acc[categoria]) {
      acc[categoria] = 0
    }
    acc[categoria] += Number(gasto.monto)
    return acc
  }, {} as Record<string, number>)

  const categorias = Object.keys(datosPorCategoria)
  const valores = Object.values(datosPorCategoria)
  const total = valores.reduce((sum, val) => sum + val, 0)

  // Paleta de colores moderna y vibrante
  const colores = [
    '#DC2626', '#2563EB', '#059669', '#D97706', 
    '#7C3AED', '#DC2626', '#0891B2', '#65A30D'
  ]

  // Configuración del gráfico de dona mejorado
  const centerX = 220
  const centerY = 180
  const outerRadius = 90
  const innerRadius = 50

  // Título del gráfico con mejor tipografía
  ctx.fillStyle = '#1F2937'
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('💰 DISTRIBUCIÓN POR CATEGORÍA', centerX, 35)
  
  // Subtítulo
  ctx.font = '12px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#6B7280'
  ctx.fillText(`Total: ${formatCOP(total)}`, centerX, 55)

  // Sombra del gráfico para profundidad
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)'
  ctx.shadowBlur = 10
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 5

  let startAngle = 0
  // Dibujar segmentos con efectos visuales mejorados
  valores.forEach((valor, index) => {
    const angle = (valor / total) * 2 * Math.PI
    
    // Crear gradiente para cada segmento
    const gradient = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, outerRadius)
    gradient.addColorStop(0, colores[index % colores.length])
    gradient.addColorStop(1, colores[index % colores.length] + '88') // Transparencia
    
    // Dibujar segmento de dona
    ctx.beginPath()
    ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + angle)
    ctx.arc(centerX, centerY, innerRadius, startAngle + angle, startAngle, true)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    // Borde sutil
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.stroke()

    startAngle += angle
  })

  // Limpiar sombra para elementos posteriores
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  // Leyenda moderna con mejor diseño
  let legendY = 80
  const legendX = 380
  
  // Título de leyenda
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#374151'
  ctx.textAlign = 'left'
  ctx.fillText('📊 Detalle', legendX, legendY)
  
  legendY += 25
  categorias.forEach((categoria, index) => {
    const porcentaje = ((valores[index] / total) * 100).toFixed(1)
    
    // Caja de color con sombra
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
    ctx.shadowBlur = 3
    ctx.fillStyle = colores[index % colores.length]
    ctx.fillRect(legendX, legendY - 10, 15, 15)
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1
    ctx.strokeRect(legendX, legendY - 10, 15, 15)
    
    // Limpiar sombra
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    
    // Texto de la categoría
    ctx.fillStyle = '#1F2937'
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif'
    ctx.fillText(categoria, legendX + 22, legendY - 2)
    
    // Porcentaje y monto
    ctx.font = '10px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = '#6B7280'
    ctx.fillText(`${porcentaje}% - ${formatCOP(valores[index])}`, legendX + 22, legendY + 10)
    
    legendY += 28
  })

  // Información central mejorada
  ctx.textAlign = 'center'
  ctx.fillStyle = '#1F2937'
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif'
  ctx.fillText('TOTAL', centerX, centerY - 8)
  
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#DC2626'
  ctx.fillText(formatCOP(total), centerX, centerY + 8)
  
  ctx.font = '10px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#6B7280'
  ctx.fillText(`${gastos.length} gastos`, centerX, centerY + 22)

  return canvas
}

export function crearGraficoPorEstado(gastos: GastoConProyecto[]): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 600
  canvas.height = 400
  const ctx = canvas.getContext('2d')!

  // Fondo con degradado sutil
  const gradientBg = ctx.createLinearGradient(0, 0, 0, canvas.height)
  gradientBg.addColorStop(0, '#FAFBFC')
  gradientBg.addColorStop(1, '#F8F9FA')
  ctx.fillStyle = gradientBg
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const aprobados = gastos.filter(g => g.aprobado).length
  const pendientes = gastos.filter(g => !g.aprobado).length
  const total = gastos.length

  const montoAprobado = gastos.filter(g => g.aprobado).reduce((sum, g) => sum + Number(g.monto), 0)
  const montoPendiente = gastos.filter(g => !g.aprobado).reduce((sum, g) => sum + Number(g.monto), 0)

  // Colores modernos con mejor contraste
  const colorAprobado = '#059669'
  const colorPendiente = '#DC2626'

  // Título con mejor tipografía
  ctx.fillStyle = '#1F2937'
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('✅ ESTADO DE APROBACIÓN', 300, 35)

  // Subtítulo con estadísticas
  ctx.font = '12px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#6B7280'
  ctx.fillText(`${total} gastos totales - ${formatCOP(montoAprobado + montoPendiente)}`, 300, 55)

  // Configuración del gráfico de barras moderno
  const barWidth = 80
  const maxHeight = 180
  const baseY = 280
  const spacing = 120

  // Centrar las barras
  const startX = (canvas.width - (2 * barWidth + spacing)) / 2

  // Barra de aprobados con gradiente y sombra
  const alturaAprobados = total > 0 ? (aprobados / total) * maxHeight : 0
  
  // Sombra para la barra
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 4
  
  const gradientAprobado = ctx.createLinearGradient(0, baseY - alturaAprobados, 0, baseY)
  gradientAprobado.addColorStop(0, '#10B981')
  gradientAprobado.addColorStop(1, '#059669')
  
  ctx.fillStyle = gradientAprobado
  ctx.fillRect(startX, baseY - alturaAprobados, barWidth, alturaAprobados)
  
  // Borde elegante
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.strokeStyle = '#047857'
  ctx.lineWidth = 2
  ctx.strokeRect(startX, baseY - alturaAprobados, barWidth, alturaAprobados)

  // Barra de pendientes con gradiente
  const alturaPendientes = total > 0 ? (pendientes / total) * maxHeight : 0
  
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 4
  
  const gradientPendiente = ctx.createLinearGradient(0, baseY - alturaPendientes, 0, baseY)
  gradientPendiente.addColorStop(0, '#EF4444')
  gradientPendiente.addColorStop(1, '#DC2626')
  
  ctx.fillStyle = gradientPendiente
  ctx.fillRect(startX + barWidth + spacing, baseY - alturaPendientes, barWidth, alturaPendientes)
  
  // Borde elegante
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.strokeStyle = '#B91C1C'
  ctx.lineWidth = 2
  ctx.strokeRect(startX + barWidth + spacing, baseY - alturaPendientes, barWidth, alturaPendientes)

  // Iconos y etiquetas mejoradas
  ctx.fillStyle = '#1F2937'
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  
  // Aprobados
  ctx.fillText('✅ APROBADOS', startX + barWidth/2, baseY + 25)
  ctx.font = '14px system-ui, -apple-system, sans-serif'
  ctx.fillText(`${aprobados} gastos`, startX + barWidth/2, baseY + 45)
  ctx.font = '12px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#059669'
  ctx.fillText(`${total > 0 ? ((aprobados / total) * 100).toFixed(1) : 0}%`, startX + barWidth/2, baseY + 62)
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif'
  ctx.fillText(formatCOP(montoAprobado), startX + barWidth/2, baseY + 77)
  
  // Pendientes
  ctx.fillStyle = '#1F2937'
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif'
  ctx.fillText('⏳ PENDIENTES', startX + barWidth + spacing + barWidth/2, baseY + 25)
  ctx.font = '14px system-ui, -apple-system, sans-serif'
  ctx.fillText(`${pendientes} gastos`, startX + barWidth + spacing + barWidth/2, baseY + 45)
  ctx.font = '12px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#DC2626'
  ctx.fillText(`${total > 0 ? ((pendientes / total) * 100).toFixed(1) : 0}%`, startX + barWidth + spacing + barWidth/2, baseY + 62)
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif'
  ctx.fillText(formatCOP(montoPendiente), startX + barWidth + spacing + barWidth/2, baseY + 77)

  // Línea base elegante
  ctx.strokeStyle = '#E5E7EB'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(startX - 20, baseY)
  ctx.lineTo(startX + 2 * barWidth + spacing + 20, baseY)
  ctx.stroke()

  // Escala de valores en el lado izquierdo
  ctx.fillStyle = '#9CA3AF'
  ctx.font = '10px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'right'
  
  for (let i = 0; i <= 4; i++) {
    const y = baseY - (i * maxHeight / 4)
    const valor = Math.round((i * total / 4))
    ctx.fillText(valor.toString(), startX - 30, y + 3)
    
    // Líneas de guía sutiles
    ctx.strokeStyle = '#F3F4F6'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(startX - 20, y)
    ctx.lineTo(startX + 2 * barWidth + spacing + 20, y)
    ctx.stroke()
  }

  return canvas
}

async function cargarLogoBase64(): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = function() {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      // Crear un canvas más grande para incluir el fondo circular
      const size = 200 // Tamaño del canvas
      const logoSize = 140 // Tamaño del logo dentro del círculo
      
      canvas.width = size
      canvas.height = size
      
      // Limpiar el canvas con transparencia
      ctx.clearRect(0, 0, size, size)
      
      // Dibujar círculo blanco de fondo con sombra sutil
      ctx.save()
      
      // Sombra del círculo
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)'
      ctx.shadowBlur = 8
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      
      // Círculo blanco de fondo
      ctx.beginPath()
      ctx.arc(size/2, size/2, size/2 - 10, 0, 2 * Math.PI)
      ctx.fillStyle = '#FFFFFF'
      ctx.fill()
      
      // Borde suave del círculo
      ctx.strokeStyle = '#E5E7EB'
      ctx.lineWidth = 2
      ctx.stroke()
      
      ctx.restore()
      
      // Dibujar el logo centrado dentro del círculo
      const x = (size - logoSize) / 2
      const y = (size - logoSize) / 2
      
      ctx.drawImage(img as HTMLImageElement, x, y, logoSize, logoSize)
      
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('Error al cargar el logo'))
    img.src = '/images/logo.svg' // Usar el logo correcto
  })
}

export async function crearPDFProfesional(gastos: GastoConProyecto[], opciones: OpcionesExportacion = { formato: 'pdf' }): Promise<jsPDF> {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  // Cargar logo corporativo
  let logoBase64: string | null = null
  try {
    logoBase64 = await cargarLogoBase64()
  } catch (error) {
    console.warn('No se pudo cargar el logo, usando versión de texto')
  }

  // === PÁGINA 1: PORTADA ===
  // Encabezado corporativo moderno con gradiente simulado
  pdf.setFillColor(220, 20, 30) // Rojo corporativo CCC
  pdf.rect(0, 0, pageWidth, 50, 'F')
  
  // Sombra del encabezado para efecto de profundidad
  pdf.setFillColor(200, 18, 27)
  pdf.rect(0, 47, pageWidth, 3, 'F')
  // Logo CCC real con fondo circular blanco mejorado
  if (logoBase64) {
    try {
      pdf.addImage(logoBase64, 'PNG', 10, 5, 40, 40)
    } catch (error) {
      console.warn('Error al agregar logo, usando fallback')
      // Fallback: Logo simulado con círculo blanco
      pdf.setFillColor(255, 255, 255)
      pdf.circle(30, 25, 15, 'F')
      pdf.setDrawColor(229, 231, 235)
      pdf.setLineWidth(1)
      pdf.circle(30, 25, 15, 'S')
      pdf.setTextColor(220, 20, 30)
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('CCC', 30, 29, { align: 'center' })
    }
  } else {
    // Fallback: Logo simulado con círculo blanco mejorado
    pdf.setFillColor(255, 255, 255)
    pdf.circle(30, 25, 15, 'F')
    pdf.setDrawColor(229, 231, 235)
    pdf.setLineWidth(1)
    pdf.circle(30, 25, 15, 'S')
    pdf.setTextColor(220, 20, 30)
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('CCC', 30, 29, { align: 'center' })
  }
  // Información de la empresa con diseño corporativo moderno
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(24)
  pdf.setFont('helvetica', 'bold')
  pdf.text('CORPORACIÓN CULTURAL CÚCUTA', 55, 20)
  
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Sistema de Gestión Cultural', 55, 28)
  
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(255, 255, 255)
  pdf.text('REPORTE EJECUTIVO DE GASTOS', 55, 38)
  
  // Línea decorativa en el encabezado
  pdf.setDrawColor(255, 255, 255)
  pdf.setLineWidth(0.5)
  pdf.line(55, 40, 190, 40)
  
  // Título principal con mejor jerarquía visual
  pdf.setTextColor(30, 30, 30)
  pdf.setFontSize(32)
  pdf.setFont('helvetica', 'bold')
  pdf.text('REPORTE FINANCIERO', pageWidth / 2, 75, { align: 'center' })
  
  pdf.setFontSize(20)
  pdf.setTextColor(220, 20, 30)
  pdf.text('ADMINISTRACION', pageWidth / 2, 88, { align: 'center' })
  
  // Línea decorativa moderna
  pdf.setDrawColor(220, 20, 30)
  pdf.setLineWidth(2)
  pdf.line(pageWidth/2 - 50, 93, pageWidth/2 + 50, 93)
  
  // Línea sutil más delgada debajo
  pdf.setDrawColor(200, 200, 200)
  pdf.setLineWidth(0.5)
  pdf.line(pageWidth/2 - 60, 96, pageWidth/2 + 60, 96)
  // Información del reporte con diseño más elegante
  const fechaActual = new Date()
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(80, 80, 80)
  pdf.text(`Generado el ${fechaActual.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`, pageWidth / 2, 110, { align: 'center' })
  
  pdf.setFontSize(10)
  pdf.setTextColor(120, 120, 120)
  pdf.text(`Hora: ${fechaActual.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit'
  })} - Usuario: Sistema Administrativo`, pageWidth / 2, 118, { align: 'center' })

  // Estadísticas principales con diseño tipo dashboard
  const totalGastos = gastos.length
  const montoTotal = gastos.reduce((sum, g) => sum + Number(g.monto), 0)
  const gastosAprobados = gastos.filter(g => g.aprobado).length
  const montoAprobado = gastos.filter(g => g.aprobado).reduce((sum, g) => sum + Number(g.monto), 0)
  const proyectosInvolucrados = new Set(gastos.map(g => g.proyecto_id)).size
  // Panel de resumen ejecutivo con diseño más sofisticado
  pdf.setFillColor(248, 250, 252)
  pdf.rect(15, 135, pageWidth - 30, 100, 'F')
  
  // Bordes del panel con sombra simulada
  pdf.setDrawColor(200, 210, 220)
  pdf.setLineWidth(0.5)
  pdf.rect(15, 135, pageWidth - 30, 100)
  
  // Sombra simulada
  pdf.setDrawColor(230, 235, 240)
  pdf.line(15.5, 235.5, pageWidth - 14.5, 235.5)
  pdf.line(pageWidth - 14.5, 135.5, pageWidth - 14.5, 235.5)
  
  pdf.setTextColor(220, 20, 30)
  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  pdf.text('-- RESUMEN EJECUTIVO --', pageWidth / 2, 150, { align: 'center' })
  
  // Línea decorativa bajo el título
  pdf.setDrawColor(220, 20, 30)
  pdf.setLineWidth(1)
  pdf.line(pageWidth/2 - 35, 153, pageWidth/2 + 35, 153)
  // Métricas en formato dashboard más elegante
  const metricas = [
    { label: 'GASTOS REGISTRADOS', valor: totalGastos.toString(), icono: '📊', color: [37, 99, 235] },
    { label: 'MONTO TOTAL', valor: formatCOP(montoTotal), icono: '💰', color: [16, 185, 129] },
    { label: 'TASA DE APROBACIÓN', valor: `${((gastosAprobados / totalGastos) * 100).toFixed(1)}%`, icono: '✅', color: [34, 197, 94] },
    { label: 'PROYECTOS ACTIVOS', valor: proyectosInvolucrados.toString(), icono: '🏗️', color: [168, 85, 247] }
  ]

  let yPos = 165
  let xPos = 25
  metricas.forEach((metrica, index) => {
    if (index === 2) {
      yPos = 200
      xPos = 25
    }
    
    // Caja de métrica con gradiente simulado
    pdf.setFillColor(255, 255, 255)
    pdf.rect(xPos, yPos, 80, 28, 'F')
    
    // Borde con color de la métrica
    pdf.setDrawColor(metrica.color[0], metrica.color[1], metrica.color[2])
    pdf.setLineWidth(1.5)
    pdf.rect(xPos, yPos, 80, 28)
    
    // Línea de acento superior
    pdf.setFillColor(metrica.color[0], metrica.color[1], metrica.color[2])
    pdf.rect(xPos, yPos, 80, 3, 'F')
    
    // Icono y valor principal
    pdf.setTextColor(40, 40, 40)
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text(metrica.valor, xPos + 40, yPos + 14, { align: 'center' })
    
    // Etiqueta
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 100, 100)
    pdf.text(metrica.label, xPos + 40, yPos + 22, { align: 'center' })
    
    xPos += 90
  })
  // Información adicional con mejor formato
  pdf.setFontSize(11)
  pdf.setTextColor(80, 80, 80)
  pdf.text(`Monto aprobado: ${formatCOP(montoAprobado)}`, 25, 250)
  pdf.text(`Monto pendiente: ${formatCOP(montoTotal - montoAprobado)}`, 25, 258)
  
  // Pie de página corporativo mejorado
  pdf.setFillColor(245, 245, 245)
  pdf.rect(0, pageHeight - 25, pageWidth, 25, 'F')
  
  pdf.setFontSize(9)
  pdf.setTextColor(120, 120, 120)
  pdf.text('Corporación Cultural Cúcuta | www.ccc.gov.co | Tel: +57 (7) 123-4567', pageWidth / 2, pageHeight - 15, { align: 'center' })
  pdf.text('Sistema de Gestión Integral - Documento Confidencial', pageWidth / 2, pageHeight - 8, { align: 'center' })
  // === PÁGINA 2: ANÁLISIS GRÁFICO MEJORADO ===
  pdf.addPage()
  
  // Encabezado de página moderno
  pdf.setFillColor(248, 249, 250)
  pdf.rect(0, 0, pageWidth, 35, 'F')
  
  // Línea decorativa superior
  pdf.setFillColor(220, 20, 30)
  pdf.rect(0, 0, pageWidth, 3, 'F')
  
  pdf.setTextColor(50, 50, 50)
  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  pdf.text('ANÁLISIS GRÁFICO', 20, 20)
  
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(100, 100, 100)
  pdf.text('Distribución y estado de gastos por categoría', 20, 28)

  // Crear y agregar gráfico por categoría con mejor posicionamiento
  const graficoCategorias = crearGraficoPorCategoria(gastos)
  const imgDataCategorias = graficoCategorias.toDataURL('image/png')
  
  pdf.setTextColor(50, 50, 50)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Distribución por Categoría de Gasto', 20, 55)
  
  // Marco para el gráfico
  pdf.setDrawColor(220, 220, 220)
  pdf.setLineWidth(0.5)
  pdf.rect(15, 60, 180, 110)
  pdf.addImage(imgDataCategorias, 'PNG', 20, 65, 170, 100)

  // Crear y agregar gráfico por estado
  const graficoEstados = crearGraficoPorEstado(gastos)
  const imgDataEstados = graficoEstados.toDataURL('image/png')
  
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Estado de Aprobación de Gastos', 20, 185)
  
  // Marco para el gráfico
  pdf.rect(15, 190, 180, 110)
  pdf.addImage(imgDataEstados, 'PNG', 20, 195, 170, 100)
  
  // Análisis textual rápido
  const porcentajeAprobacion = ((gastosAprobados / totalGastos) * 100).toFixed(1)
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'italic')
  pdf.setTextColor(100, 100, 100)
  // === PÁGINA 3: TABLA DETALLADA MEJORADA ===
  pdf.addPage()
  
  // Encabezado moderno
  pdf.setFillColor(248, 249, 250)
  pdf.rect(0, 0, pageWidth, 35, 'F')
  
  pdf.setFillColor(220, 20, 30)
  pdf.rect(0, 0, pageWidth, 3, 'F')
  
  pdf.setTextColor(50, 50, 50)
  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  pdf.text('DETALLE DE GASTOS', 20, 20)
  
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(100, 100, 100)
  pdf.text(`Mostrando los primeros gastos de ${totalGastos} registros totales`, 20, 28)

  // Configuración de tabla mejorada
  pdf.setTextColor(50, 50, 50)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')

  const gastosParaTabla = gastos.slice(0, 25) // Primeros 25 gastos
  let yPosition = 50
  // Encabezados de tabla con mejor diseño y iconos
  pdf.setFont('helvetica', 'bold')
  pdf.setFillColor(220, 20, 30)
  pdf.rect(10, yPosition - 5, pageWidth - 20, 10, 'F')
  
  pdf.setTextColor(255, 255, 255)
  pdf.text('PROYECTO', 12, yPosition + 1)
  pdf.text('CATEGORÍA', 50, yPosition + 1)
  pdf.text('DESCRIPCIÓN', 80, yPosition + 1)
  pdf.text('MONTO', 125, yPosition + 1)
  pdf.text('FECHA', 155, yPosition + 1)
  pdf.text('APROBADO', 180, yPosition + 1)

  yPosition += 12

  // Filas de datos con mejor formato
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(50, 50, 50)
  
  gastosParaTabla.forEach((gasto, index) => {
    if (yPosition > 270) {
      pdf.addPage()
      
      // Repetir encabezado en nueva página
      pdf.setFillColor(248, 249, 250)
      pdf.rect(0, 0, pageWidth, 25, 'F')
      pdf.setFillColor(220, 20, 30)
      pdf.rect(0, 0, pageWidth, 3, 'F')
      
      yPosition = 35
      
      pdf.setFont('helvetica', 'bold')
      pdf.setFillColor(220, 20, 30)
      pdf.rect(10, yPosition - 5, pageWidth - 20, 10, 'F')
        pdf.setTextColor(255, 255, 255)
      pdf.text('PROYECTO', 12, yPosition + 1)
      pdf.text('CATEGORÍA', 50, yPosition + 1)
      pdf.text('DESCRIPCIÓN', 80, yPosition + 1)
      pdf.text('MONTO', 125, yPosition + 1)
      pdf.text('FECHA', 155, yPosition + 1)
      pdf.text('APROBADO', 180, yPosition + 1)
      
      yPosition += 12
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(50, 50, 50)
    }    // Datos formateados con mejor optimización de espacio
    const proyecto = gasto.proyecto?.nombre || 'N/A'
    const categoria = gasto.tipo_gasto.toUpperCase()
    const descripcion = gasto.descripcion.length > 25 ? 
      gasto.descripcion.substring(0, 22) + '...' : gasto.descripcion
    const monto = formatCOP(gasto.monto)
    const fecha = new Date(gasto.fecha_gasto).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    })

    // Alternar color de fondo para mejor legibilidad
    if (index % 2 === 0) {
      pdf.setFillColor(250, 250, 250)
      pdf.rect(10, yPosition - 2, pageWidth - 20, 7, 'F')
    }

    // Textos de la fila con mejor distribución
    pdf.setTextColor(50, 50, 50)
    pdf.text(proyecto.length > 15 ? proyecto.substring(0, 12) + '...' : proyecto, 12, yPosition + 2)
    pdf.text(categoria.length > 10 ? categoria.substring(0, 8) + '.' : categoria, 50, yPosition + 2)
    pdf.text(descripcion, 80, yPosition + 2)
    pdf.text(monto, 125, yPosition + 2)
    pdf.text(fecha, 155, yPosition + 2)
    
    // Icono de estado de aprobación - más limpio y profesional
    pdf.setFontSize(12)
    if (gasto.aprobado) {
      pdf.setTextColor(0, 150, 60)  // Verde más profesional
      pdf.text('✓', 185, yPosition + 2)
    } else {
      pdf.setTextColor(220, 20, 30)  // Rojo corporativo
      pdf.text('✗', 185, yPosition + 2)
    }
    
    // Restaurar tamaño y color de fuente
    pdf.setFontSize(9)
    pdf.setTextColor(50, 50, 50)

    yPosition += 7
  })

  // Resumen final en la tabla
  if (yPosition < 250) {
    yPosition += 10
    pdf.setDrawColor(220, 20, 30)
    pdf.setLineWidth(0.5)
    pdf.line(10, yPosition, pageWidth - 10, yPosition)
    
    yPosition += 8
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(220, 20, 30)
    pdf.text(`TOTAL MOSTRADO: ${gastosParaTabla.length} gastos`, 12, yPosition)
    pdf.text(`MONTO TOTAL: ${formatCOP(gastosParaTabla.reduce((sum, g) => sum + Number(g.monto), 0))}`, 120, yPosition)
  }

  // Pie de página mejorado
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(120, 120, 120)
  pdf.text(`Generado: ${fechaActual.toLocaleString('es-CO')}`, 10, pageHeight - 15)
  pdf.text('Corporación Cultural Cúcuta', pageWidth - 10, pageHeight - 15, { align: 'right' })
  pdf.text('Documento Confidencial - Uso Interno', pageWidth / 2, pageHeight - 10, { align: 'center' })

  return pdf
}

export function descargarPDF(pdf: jsPDF, nombreArchivo: string = "reporte-gastos-corporativo.pdf") {
  pdf.save(nombreArchivo)
}

export async function exportarGastosAPDF(userId: string, opciones: OpcionesExportacion = { formato: 'pdf' }): Promise<void> {
  try {
    // Obtener gastos
    const gastos = await obtenerGastosParaExportacion(userId)
    
    if (gastos.length === 0) {
      throw new Error("No hay gastos para exportar")
    }

    // Crear PDF profesional
    const pdf = await crearPDFProfesional(gastos, opciones)
    
    // Generar nombre del archivo con fecha actual
    const fechaActual = new Date().toISOString().split("T")[0]
    const nombreArchivo = `reporte-gastos-corporativo-${fechaActual}.pdf`
    
    // Descargar archivo PDF
    descargarPDF(pdf, nombreArchivo)
    
  } catch (error) {
    console.error("Error al exportar gastos a PDF:", error)
    throw error
  }
}

export async function exportarGastos(userId: string, formato: 'csv' | 'excel' | 'pdf' = 'excel'): Promise<void> {
  if (formato === 'pdf') {
    return await exportarGastosAPDF(userId)
  } else if (formato === 'excel') {
    return await exportarGastosAExcel(userId)
  } else {
    return await exportarGastosACSV(userId)
  }
}
