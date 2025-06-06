// Utilidades para exportar pagos a diferentes formatos con soporte para Excel profesional y PDF corporativo
import { supabase } from "@/lib/supabase"
import { formatCOP } from "@/lib/format-cop"
import type { PagoPersonal, Proyecto, Trabajador } from "@/lib/types"
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'

interface PagoConProyectoYTrabajador extends PagoPersonal {
  proyecto?: Proyecto
  trabajador?: Trabajador
}

interface OpcionesExportacion {
  formato: 'csv' | 'excel' | 'pdf'
  incluirResumen?: boolean
  filtros?: {
    fechaInicio?: string
    fechaFin?: string
    proyecto?: string
    tipoLabor?: string
    estado?: string
  }
}

export async function obtenerPagosParaExportacion(userId: string): Promise<PagoConProyectoYTrabajador[]> {
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

    // Obtener todos los pagos de esos proyectos con información de trabajadores
    const { data: pagos, error: pagosError } = await supabase
      .from("pagos_personal")
      .select(`
        *,
        trabajadores(*)
      `)
      .in("proyecto_id", proyectoIds)
      .order("fecha_actividad", { ascending: false })

    if (pagosError) {
      throw pagosError
    }

    // Combinar pagos con información del proyecto
    const pagosConProyectoYTrabajador: PagoConProyectoYTrabajador[] = pagos?.map((pago) => ({
      ...pago,
      proyecto: proyectos.find((p) => p.id === pago.proyecto_id),
      trabajador: (pago as any).trabajadores
    })) || []

    return pagosConProyectoYTrabajador
  } catch (error) {
    console.error("Error al obtener pagos para exportación:", error)
    throw error
  }
}

export function convertirPagosACSV(pagos: PagoConProyectoYTrabajador[]): string {
  // Definir las columnas del CSV con nombres más profesionales
  const columnas = [
    "CÓDIGO PROYECTO",
    "NOMBRE DEL PROYECTO", 
    "CÓDIGO TRABAJADOR",
    "NOMBRE DEL TRABAJADOR",
    "ESPECIALIDAD",
    "TIPO DE LABOR",
    "FECHA DE ACTIVIDAD",
    "HORAS TRABAJADAS",
    "VALOR POR HORA",
    "VALOR PACTADO",
    "VALOR FORMATEADO (COP)",
    "ESTADO DE PAGO",
    "FECHA DE PAGO",
    "OBSERVACIONES ADICIONALES",
    "FECHA DE REGISTRO EN SISTEMA",
    "MES DE ACTIVIDAD",
    "AÑO DE ACTIVIDAD",
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

  // Función para obtener el label del tipo de labor
  const getTipoLaborLabel = (tipo: string) => {
    const tipos = {
      artistica: "ACTIVIDAD ARTÍSTICA",
      tecnica: "SOPORTE TÉCNICO",
      administrativa: "GESTIÓN ADMINISTRATIVA",
      logistica: "APOYO LOGÍSTICO",
      produccion: "PRODUCCIÓN EJECUTIVA",
      otros: "OTRAS ACTIVIDADES",
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
  const filas = pagos.map((pago) => {
    const infoFecha = obtenerInfoFecha(pago.fecha_actividad)
    const infoRegistro = obtenerInfoFecha(pago.created_at)
    
    return [
      escaparCSV(pago.proyecto?.id || "N/A"),
      escaparCSV(pago.proyecto?.nombre || "PROYECTO NO ENCONTRADO"),
      escaparCSV(pago.trabajador?.id || "N/A"),
      escaparCSV(pago.trabajador?.nombre || "TRABAJADOR NO ENCONTRADO"),
      escaparCSV(pago.trabajador?.especialidad || "SIN ESPECIFICAR"),
      escaparCSV(getTipoLaborLabel(pago.tipo_labor)),
      escaparCSV(new Date(pago.fecha_actividad).toLocaleDateString("es-CO", { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })),
      escaparCSV(pago.horas_trabajadas || "No especificado"),
      escaparCSV(pago.trabajador?.valor_hora ? formatCOP(pago.trabajador.valor_hora) : "No especificado"),
      escaparCSV(pago.valor_pactado),
      escaparCSV(formatCOP(pago.valor_pactado)),
      escaparCSV(pago.estado_pago === "pagado" ? "✅ PAGADO" : pago.estado_pago === "pendiente" ? "⏳ PENDIENTE DE PAGO" : pago.estado_pago?.toUpperCase()),
      escaparCSV(pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString("es-CO", { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) : "SIN FECHA DE PAGO"),
      escaparCSV(pago.observaciones || "SIN OBSERVACIONES"),
      escaparCSV(new Date(pago.created_at).toLocaleDateString("es-CO", { 
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

export function descargarCSV(csvContent: string, nombreArchivo: string = "pagos-personal.csv") {
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

export function crearExcelProfesional(pagos: PagoConProyectoYTrabajador[], opciones: OpcionesExportacion = { formato: 'excel' }): XLSX.WorkBook {
  const wb = XLSX.utils.book_new()
  
  // Función para obtener el label del tipo de labor
  const getTipoLaborLabel = (tipo: string) => {
    const tipos = {
      artistica: "ACTIVIDAD ARTÍSTICA",
      tecnica: "SOPORTE TÉCNICO",
      administrativa: "GESTIÓN ADMINISTRATIVA",
      logistica: "APOYO LOGÍSTICO",
      produccion: "PRODUCCIÓN EJECUTIVA",
      otros: "OTRAS ACTIVIDADES",
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
  const datosDetallados = pagos.map((pago) => {
    const infoFecha = obtenerInfoFecha(pago.fecha_actividad)
    const infoRegistro = obtenerInfoFecha(pago.created_at)
    
    return {
      "CÓDIGO PROYECTO": pago.proyecto?.id || "N/A",
      "NOMBRE DEL PROYECTO": pago.proyecto?.nombre || "PROYECTO NO ENCONTRADO",
      "CÓDIGO TRABAJADOR": pago.trabajador?.id || "N/A",
      "NOMBRE DEL TRABAJADOR": pago.trabajador?.nombre || "TRABAJADOR NO ENCONTRADO",
      "ESPECIALIDAD": pago.trabajador?.especialidad || "SIN ESPECIFICAR",
      "TIPO DE LABOR": getTipoLaborLabel(pago.tipo_labor),
      "FECHA DE ACTIVIDAD": infoFecha.fechaFormateada,
      "HORAS TRABAJADAS": pago.horas_trabajadas || 0,
      "VALOR POR HORA": pago.trabajador?.valor_hora || 0,
      "VALOR NUMÉRICO": Number(pago.valor_pactado),
      "VALOR FORMATEADO (COP)": formatCOP(pago.valor_pactado),
      "ESTADO DE PAGO": pago.estado_pago === "pagado" ? "✅ PAGADO" : pago.estado_pago === "pendiente" ? "⏳ PENDIENTE" : pago.estado_pago?.toUpperCase(),
      "FECHA DE PAGO": pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString("es-CO") : "SIN FECHA",
      "OBSERVACIONES": pago.observaciones || "SIN OBSERVACIONES",
      "FECHA DE REGISTRO": infoRegistro.fechaFormateada,
      "MES DE ACTIVIDAD": infoFecha.mes,
      "AÑO DE ACTIVIDAD": infoFecha.año,
      "TRIMESTRE": infoFecha.trimestre
    }
  })

  const wsDetallado = XLSX.utils.json_to_sheet(datosDetallados)
  
  // Configurar ancho de columnas para mejor presentación
  const anchosColumnas = [
    { wch: 15 }, // CÓDIGO PROYECTO
    { wch: 35 }, // NOMBRE DEL PROYECTO
    { wch: 15 }, // CÓDIGO TRABAJADOR
    { wch: 30 }, // NOMBRE DEL TRABAJADOR
    { wch: 20 }, // ESPECIALIDAD
    { wch: 25 }, // TIPO DE LABOR
    { wch: 25 }, // FECHA DE ACTIVIDAD
    { wch: 15 }, // HORAS TRABAJADAS
    { wch: 15 }, // VALOR POR HORA
    { wch: 15 }, // VALOR NUMÉRICO
    { wch: 20 }, // VALOR FORMATEADO
    { wch: 15 }, // ESTADO DE PAGO
    { wch: 20 }, // FECHA DE PAGO
    { wch: 30 }, // OBSERVACIONES
    { wch: 25 }, // FECHA DE REGISTRO
    { wch: 15 }, // MES DE ACTIVIDAD
    { wch: 10 }, // AÑO DE ACTIVIDAD
    { wch: 12 }  // TRIMESTRE
  ]
  
  wsDetallado['!cols'] = anchosColumnas
  XLSX.utils.book_append_sheet(wb, wsDetallado, "📊 REPORTE DETALLADO")

  // === HOJA 2: RESUMEN POR PROYECTO ===
  const resumenPorProyecto = pagos.reduce((acc, pago) => {
    const proyectoId = pago.proyecto?.id || "N/A"
    const proyectoNombre = pago.proyecto?.nombre || "PROYECTO NO ENCONTRADO"
    
    if (!acc[proyectoId]) {
      acc[proyectoId] = {
        nombre: proyectoNombre,
        totalPagos: 0,
        cantidadPagos: 0,
        pagosPendientes: 0,
        pagosPagados: 0,
        montoPendiente: 0,
        montoPagado: 0
      }
    }
    
    acc[proyectoId].totalPagos += Number(pago.valor_pactado)
    acc[proyectoId].cantidadPagos += 1
    
    if (pago.estado_pago === "pagado") {
      acc[proyectoId].pagosPagados += 1
      acc[proyectoId].montoPagado += Number(pago.valor_pactado)
    } else {
      acc[proyectoId].pagosPendientes += 1
      acc[proyectoId].montoPendiente += Number(pago.valor_pactado)
    }
    
    return acc
  }, {} as Record<string, any>)

  const datosResumenProyecto = Object.entries(resumenPorProyecto).map(([id, data]) => ({
    "CÓDIGO": id,
    "NOMBRE DEL PROYECTO": data.nombre,
    "TOTAL PAGOS": formatCOP(data.totalPagos),
    "CANTIDAD DE PAGOS": data.cantidadPagos,
    "PAGOS PAGADOS": data.pagosPagados,
    "PAGOS PENDIENTES": data.pagosPendientes,
    "MONTO PAGADO": formatCOP(data.montoPagado),
    "MONTO PENDIENTE": formatCOP(data.montoPendiente),
    "% PAGADOS": data.cantidadPagos > 0 ? `${((data.pagosPagados / data.cantidadPagos) * 100).toFixed(1)}%` : "0%"
  }))

  const wsResumenProyecto = XLSX.utils.json_to_sheet(datosResumenProyecto)
  wsResumenProyecto['!cols'] = [
    { wch: 15 }, { wch: 35 }, { wch: 18 }, { wch: 12 }, 
    { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 12 }
  ]
  XLSX.utils.book_append_sheet(wb, wsResumenProyecto, "📈 RESUMEN POR PROYECTO")

  // === HOJA 3: RESUMEN POR TIPO DE LABOR ===
  const resumenPorTipoLabor = pagos.reduce((acc, pago) => {
    const tipoLabor = getTipoLaborLabel(pago.tipo_labor)
    
    if (!acc[tipoLabor]) {
      acc[tipoLabor] = {
        totalPagos: 0,
        cantidadPagos: 0,
        pagosPagados: 0,
        pagosPendientes: 0
      }
    }
    
    acc[tipoLabor].totalPagos += Number(pago.valor_pactado)
    acc[tipoLabor].cantidadPagos += 1
    
    if (pago.estado_pago === "pagado") {
      acc[tipoLabor].pagosPagados += 1
    } else {
      acc[tipoLabor].pagosPendientes += 1
    }
    
    return acc
  }, {} as Record<string, any>)

  const datosResumenTipoLabor = Object.entries(resumenPorTipoLabor).map(([tipo, data]) => ({
    "TIPO DE LABOR": tipo,
    "TOTAL INVERTIDO": formatCOP(data.totalPagos),
    "CANTIDAD DE PAGOS": data.cantidadPagos,
    "PAGADOS": data.pagosPagados,
    "PENDIENTES": data.pagosPendientes,
    "PROMEDIO POR PAGO": formatCOP(data.totalPagos / data.cantidadPagos),
    "% DEL TOTAL": `${((data.totalPagos / pagos.reduce((sum, p) => sum + Number(p.valor_pactado), 0)) * 100).toFixed(1)}%`
  }))

  const wsResumenTipoLabor = XLSX.utils.json_to_sheet(datosResumenTipoLabor)
  wsResumenTipoLabor['!cols'] = [
    { wch: 30 }, { wch: 18 }, { wch: 12 }, { wch: 10 }, 
    { wch: 10 }, { wch: 18 }, { wch: 12 }
  ]
  XLSX.utils.book_append_sheet(wb, wsResumenTipoLabor, "📊 RESUMEN POR TIPO LABOR")

  // === HOJA 4: ESTADÍSTICAS GENERALES ===
  const totalGeneral = pagos.reduce((sum, p) => sum + Number(p.valor_pactado), 0)
  const totalPagado = pagos.filter(p => p.estado_pago === "pagado").reduce((sum, p) => sum + Number(p.valor_pactado), 0)
  const totalPendiente = pagos.filter(p => p.estado_pago === "pendiente").reduce((sum, p) => sum + Number(p.valor_pactado), 0)
  
  const estadisticasGenerales = [
    { "MÉTRICA": "TOTAL DE PAGOS REGISTRADOS", "VALOR": pagos.length.toString(), "DESCRIPCIÓN": "Cantidad total de pagos en el sistema" },
    { "MÉTRICA": "MONTO TOTAL INVERTIDO", "VALOR": formatCOP(totalGeneral), "DESCRIPCIÓN": "Suma total de todos los pagos" },
    { "MÉTRICA": "MONTO PAGADO", "VALOR": formatCOP(totalPagado), "DESCRIPCIÓN": "Suma de pagos ya realizados" },
    { "MÉTRICA": "MONTO PENDIENTE", "VALOR": formatCOP(totalPendiente), "DESCRIPCIÓN": "Suma de pagos pendientes de realizar" },
    { "MÉTRICA": "% DE PAGOS REALIZADOS", "VALOR": `${((totalPagado / totalGeneral) * 100).toFixed(1)}%`, "DESCRIPCIÓN": "Porcentaje de pagos realizados vs total" },
    { "MÉTRICA": "PROMEDIO POR PAGO", "VALOR": formatCOP(totalGeneral / pagos.length), "DESCRIPCIÓN": "Valor promedio por pago registrado" },
    { "MÉTRICA": "PROYECTOS INVOLUCRADOS", "VALOR": new Set(pagos.map(p => p.proyecto_id)).size.toString(), "DESCRIPCIÓN": "Cantidad de proyectos con pagos" },
    { "MÉTRICA": "TRABAJADORES ACTIVOS", "VALOR": new Set(pagos.map(p => p.trabajador_id)).size.toString(), "DESCRIPCIÓN": "Cantidad de trabajadores con pagos" },
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

export function descargarExcel(workbook: XLSX.WorkBook, nombreArchivo: string = "reporte-pagos-profesional.xlsx") {
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

export async function exportarPagosACSV(userId: string): Promise<void> {
  try {
    // Obtener pagos
    const pagos = await obtenerPagosParaExportacion(userId)
    
    if (pagos.length === 0) {
      throw new Error("No hay pagos para exportar")
    }

    // Convertir a CSV
    const csvContent = convertirPagosACSV(pagos)
    
    // Generar nombre del archivo con fecha actual
    const fechaActual = new Date().toISOString().split("T")[0]
    const nombreArchivo = `pagos-personal-${fechaActual}.csv`
    
    // Descargar archivo
    descargarCSV(csvContent, nombreArchivo)
    
  } catch (error) {
    console.error("Error al exportar pagos:", error)
    throw error
  }
}

export async function exportarPagosAExcel(userId: string, opciones: OpcionesExportacion = { formato: 'excel' }): Promise<void> {
  try {
    // Obtener pagos
    const pagos = await obtenerPagosParaExportacion(userId)
    
    if (pagos.length === 0) {
      throw new Error("No hay pagos para exportar")
    }

    // Crear workbook de Excel profesional
    const workbook = crearExcelProfesional(pagos, opciones)
    
    // Generar nombre del archivo con fecha actual
    const fechaActual = new Date().toISOString().split("T")[0]
    const nombreArchivo = `reporte-pagos-profesional-${fechaActual}.xlsx`
    
    // Descargar archivo Excel
    descargarExcel(workbook, nombreArchivo)
    
  } catch (error) {
    console.error("Error al exportar pagos a Excel:", error)
    throw error
  }
}

// === FUNCIONES PARA GENERAR PDF PROFESIONAL ===

export function crearGraficoPorTipoLabor(pagos: PagoConProyectoYTrabajador[]): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 400
  canvas.height = 300
  const ctx = canvas.getContext('2d')!
  
  // Agrupar por tipo de labor
  const datosPorTipo = pagos.reduce((acc, pago) => {
    const tipo = pago.tipo_labor || 'otros'
    acc[tipo] = (acc[tipo] || 0) + Number(pago.valor_pactado)
    return acc
  }, {} as Record<string, number>)

  const colores = ['#DC2626', '#EA580C', '#D97706', '#65A30D', '#059669', '#0891B2']
  const entradas = Object.entries(datosPorTipo)
  const total = entradas.reduce((sum, [_, valor]) => sum + valor, 0)
  
  // Dibujar gráfico de pastel
  let anguloInicial = 0
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const radio = 80

  entradas.forEach(([tipo, valor], index) => {
    const angulo = (valor / total) * 2 * Math.PI
    
    ctx.beginPath()
    ctx.arc(centerX, centerY, radio, anguloInicial, anguloInicial + angulo)
    ctx.lineTo(centerX, centerY)
    ctx.fillStyle = colores[index % colores.length]
    ctx.fill()
    
    anguloInicial += angulo
  })

  // Agregar total en el centro
  ctx.fillStyle = '#DC2626'
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(formatCOP(total), centerX, centerY + 8)
  
  ctx.font = '10px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#6B7280'
  ctx.fillText(`${pagos.length} pagos`, centerX, centerY + 22)

  return canvas
}

export function crearGraficoPorEstado(pagos: PagoConProyectoYTrabajador[]): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 400
  canvas.height = 300
  const ctx = canvas.getContext('2d')!
  
  const pagados = pagos.filter(p => p.estado_pago === 'pagado').reduce((sum, p) => sum + Number(p.valor_pactado), 0)
  const pendientes = pagos.filter(p => p.estado_pago === 'pendiente').reduce((sum, p) => sum + Number(p.valor_pactado), 0)
  
  const datos = [
    { label: 'Pagados', valor: pagados, color: '#10B981' },
    { label: 'Pendientes', valor: pendientes, color: '#F59E0B' }
  ]
  
  const total = pagados + pendientes
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const radio = 80
  
  let anguloInicial = 0
  
  datos.forEach((item) => {
    const angulo = (item.valor / total) * 2 * Math.PI
    
    ctx.beginPath()
    ctx.arc(centerX, centerY, radio, anguloInicial, anguloInicial + angulo)
    ctx.lineTo(centerX, centerY)
    ctx.fillStyle = item.color
    ctx.fill()
    
    anguloInicial += angulo
  })

  // Total en el centro
  ctx.fillStyle = '#DC2626'
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(formatCOP(total), centerX, centerY + 8)
  
  ctx.font = '10px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#6B7280'
  ctx.fillText(`${pagos.length} pagos`, centerX, centerY + 22)

  return canvas
}

async function cargarLogoBase64(): Promise<string> {
  // Implementar carga del logo corporativo si está disponible
  return ""
}

export async function crearPDFProfesional(pagos: PagoConProyectoYTrabajador[], opciones: OpcionesExportacion = { formato: 'pdf' }): Promise<jsPDF> {
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
  pdf.text('REPORTE EJECUTIVO DE PAGOS', 55, 38)
  
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
  pdf.text('PAGOS PERSONAL', pageWidth / 2, 88, { align: 'center' })
  
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
  const totalPagos = pagos.length
  const montoTotal = pagos.reduce((sum, p) => sum + Number(p.valor_pactado), 0)
  const pagosPagados = pagos.filter(p => p.estado_pago === 'pagado').length
  const montoAprobado = pagos.filter(p => p.estado_pago === 'pagado').reduce((sum, p) => sum + Number(p.valor_pactado), 0)
  const proyectosInvolucrados = new Set(pagos.map(p => p.proyecto_id)).size

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
    { label: 'PAGOS REGISTRADOS', valor: totalPagos.toString(), icono: '📊', color: [37, 99, 235] },
    { label: 'MONTO TOTAL', valor: formatCOP(montoTotal), icono: '💰', color: [16, 185, 129] },
    { label: 'TASA DE PAGO', valor: `${((pagosPagados / totalPagos) * 100).toFixed(1)}%`, icono: '✅', color: [34, 197, 94] },
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
  pdf.text(`Monto pagado: ${formatCOP(montoAprobado)}`, 25, 250)
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
  pdf.text('Distribución y estado de pagos por tipo de labor', 20, 28)

  // Crear y agregar gráfico por tipo de labor
  const graficoTipoLabor = crearGraficoPorTipoLabor(pagos)
  const imgDataTipoLabor = graficoTipoLabor.toDataURL('image/png')
  
  pdf.setTextColor(50, 50, 50)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Distribución por Tipo de Labor', 20, 55)
  
  // Marco para el gráfico
  pdf.setDrawColor(220, 220, 220)
  pdf.setLineWidth(0.5)
  pdf.rect(15, 60, 180, 110)
  pdf.addImage(imgDataTipoLabor, 'PNG', 20, 65, 170, 100)

  // Crear y agregar gráfico por estado
  const graficoEstados = crearGraficoPorEstado(pagos)
  const imgDataEstados = graficoEstados.toDataURL('image/png')
  
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Estado de Realización de Pagos', 20, 185)
  
  // Marco para el gráfico
  pdf.rect(15, 190, 180, 110)
  pdf.addImage(imgDataEstados, 'PNG', 20, 195, 170, 100)

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
  pdf.text('DETALLE DE PAGOS', 20, 20)
  
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(100, 100, 100)
  pdf.text(`Mostrando los primeros pagos de ${totalPagos} registros totales`, 20, 28)

  // Configuración de tabla mejorada
  pdf.setTextColor(50, 50, 50)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')

  const pagosParaTabla = pagos.slice(0, 25) // Primeros 25 pagos
  let yPosition = 50

  // Encabezados de tabla con mejor diseño
  pdf.setFont('helvetica', 'bold')
  pdf.setFillColor(220, 20, 30)
  pdf.rect(10, yPosition - 5, pageWidth - 20, 10, 'F')
  
  pdf.setTextColor(255, 255, 255)
  pdf.text('PROYECTO', 12, yPosition + 1)
  pdf.text('TRABAJADOR', 50, yPosition + 1)
  pdf.text('TIPO LABOR', 80, yPosition + 1)
  pdf.text('MONTO', 115, yPosition + 1)
  pdf.text('FECHA', 145, yPosition + 1)
  pdf.text('ESTADO', 175, yPosition + 1)

  yPosition += 12
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(50, 50, 50)

  // Filas de datos con mejor formato
  pagosParaTabla.forEach((pago, index) => {
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
      pdf.text('TRABAJADOR', 50, yPosition + 1)
      pdf.text('TIPO LABOR', 80, yPosition + 1)
      pdf.text('MONTO', 115, yPosition + 1)
      pdf.text('FECHA', 145, yPosition + 1)
      pdf.text('ESTADO', 175, yPosition + 1)
      
      yPosition += 12
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(50, 50, 50)
    }

    // Datos formateados con mejor optimización de espacio
    const proyecto = pago.proyecto?.nombre || 'N/A'
    const trabajador = pago.trabajador?.nombre || 'N/A'
    const tipoLabor = pago.tipo_labor.toUpperCase()
    const monto = formatCOP(pago.valor_pactado)
    const fecha = new Date(pago.fecha_actividad).toLocaleDateString('es-CO', {
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
    pdf.text(trabajador.length > 15 ? trabajador.substring(0, 12) + '...' : trabajador, 50, yPosition + 2)
    pdf.text(tipoLabor.length > 10 ? tipoLabor.substring(0, 8) + '.' : tipoLabor, 80, yPosition + 2)
    pdf.text(monto, 115, yPosition + 2)
    pdf.text(fecha, 145, yPosition + 2)
    
    // Icono de estado de pago - más limpio y profesional
    pdf.setFontSize(12)
    if (pago.estado_pago === 'pagado') {
      pdf.setTextColor(0, 150, 60)  // Verde más profesional
      pdf.text('✓', 175, yPosition + 2)
    } else {
      pdf.setTextColor(220, 20, 30)  // Rojo corporativo
      pdf.text('⏳', 175, yPosition + 2)
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
    pdf.text(`TOTAL MOSTRADO: ${pagosParaTabla.length} pagos`, 12, yPosition)
    pdf.text(`MONTO TOTAL: ${formatCOP(pagosParaTabla.reduce((sum, p) => sum + Number(p.valor_pactado), 0))}`, 120, yPosition)
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

export function descargarPDF(pdf: jsPDF, nombreArchivo: string = "reporte-pagos-corporativo.pdf") {
  pdf.save(nombreArchivo)
}

export async function exportarPagosAPDF(userId: string, opciones: OpcionesExportacion = { formato: 'pdf' }): Promise<void> {
  try {
    // Obtener pagos
    const pagos = await obtenerPagosParaExportacion(userId)
    
    if (pagos.length === 0) {
      throw new Error("No hay pagos para exportar")
    }

    // Crear PDF profesional
    const pdf = await crearPDFProfesional(pagos, opciones)
    
    // Generar nombre del archivo con fecha actual
    const fechaActual = new Date().toISOString().split("T")[0]
    const nombreArchivo = `reporte-pagos-corporativo-${fechaActual}.pdf`
    
    // Descargar archivo PDF
    descargarPDF(pdf, nombreArchivo)
    
  } catch (error) {
    console.error("Error al exportar pagos a PDF:", error)
    throw error
  }
}

export async function exportarPagos(userId: string, formato: 'csv' | 'excel' | 'pdf' = 'excel'): Promise<void> {
  if (formato === 'pdf') {
    return await exportarPagosAPDF(userId)
  } else if (formato === 'excel') {
    return await exportarPagosAExcel(userId)
  } else {
    return await exportarPagosACSV(userId)
  }
}
