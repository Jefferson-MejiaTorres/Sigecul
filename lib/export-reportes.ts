import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import { supabase } from './supabase'

// Interfaces para los datos consolidados
export interface DatosConsolidados {
  proyectos: ProyectoCompleto[]
  gastos: GastoCompleto[]
  pagos: PagoCompleto[]
  evidencias: EvidenciaCompleta[]
  resumen: ResumenGeneral
}

export interface ProyectoCompleto {
  id: string
  nombre: string
  descripcion: string
  estado: string
  presupuesto: number
  fecha_inicio: string
  fecha_fin?: string
  responsable: string
  gastos_totales: number
  pagos_totales: number
  evidencias_count: number
}

export interface GastoCompleto {
  id: string
  concepto: string
  monto: number
  categoria: string
  fecha_gasto: string
  proyecto_nombre: string
  proyecto_id: string
  evidencia_url?: string
}

export interface PagoCompleto {
  id: string
  trabajador_nombre: string
  monto: number
  concepto: string
  fecha_pago: string
  proyecto_nombre: string
  proyecto_id: string
  horas_trabajadas?: number
}

export interface EvidenciaCompleta {
  id: string
  titulo: string
  descripcion: string
  tipo: string
  fecha_subida: string
  proyecto_nombre: string
  proyecto_id: string
  url: string
  tamano: number
}

export interface ResumenGeneral {
  totalProyectos: number
  proyectosActivos: number
  presupuestoTotal: number
  gastosTotal: number
  pagosTotal: number
  evidenciasTotal: number
  eficienciaPresupuestal: number
  periodoInicio: string
  periodoFin: string
}

// Filtros para la consulta de datos
export interface FiltrosReporte {
  fechaInicio?: Date
  fechaFin?: Date
  proyectos?: string[]
  modulos?: string[]
  estados?: string[]
  montoMinimo?: number
  montoMaximo?: number
}

/**
 * Obtiene todos los datos consolidados aplicando los filtros especificados
 */
export async function obtenerDatosConsolidados(filtros: FiltrosReporte = {}): Promise<DatosConsolidados> {
  try {
    // Construir filtros de fecha
    const fechaInicio = filtros.fechaInicio?.toISOString().split('T')[0]
    const fechaFin = filtros.fechaFin?.toISOString().split('T')[0]

    // Obtener proyectos con datos relacionados
    let queryProyectos = supabase
      .from('proyectos')
      .select(`
        id,
        nombre,
        descripcion,
        estado,
        presupuesto,
        fecha_inicio,
        fecha_fin,
        responsable
      `)

    if (filtros.proyectos?.length) {
      queryProyectos = queryProyectos.in('id', filtros.proyectos)
    }
    if (filtros.estados?.length) {
      queryProyectos = queryProyectos.in('estado', filtros.estados)
    }

    const { data: proyectos } = await queryProyectos

    // Obtener gastos con filtros
    let queryGastos = supabase
      .from('gastos_proyecto')
      .select(`
        id,
        descripcion,
        monto,
        tipo_gasto,
        fecha_gasto,
        proyecto_id,
        evidencia_url
      `)

    if (fechaInicio) queryGastos = queryGastos.gte('fecha_gasto', fechaInicio)
    if (fechaFin) queryGastos = queryGastos.lte('fecha_gasto', fechaFin)
    if (filtros.proyectos?.length) queryGastos = queryGastos.in('proyecto_id', filtros.proyectos)
    if (filtros.montoMinimo) queryGastos = queryGastos.gte('monto', filtros.montoMinimo)
    if (filtros.montoMaximo) queryGastos = queryGastos.lte('monto', filtros.montoMaximo)

    const { data: gastosRaw } = await queryGastos

    // Obtener pagos con filtros
    let queryPagos = supabase
      .from('pagos_personal')
      .select(`
        id,
        trabajador_id,
        valor_pactado,
        tipo_labor,
        fecha_pago,
        proyecto_id,
        horas_trabajadas
      `)

    if (fechaInicio) queryPagos = queryPagos.gte('fecha_pago', fechaInicio)
    if (fechaFin) queryPagos = queryPagos.lte('fecha_pago', fechaFin)
    if (filtros.proyectos?.length) queryPagos = queryPagos.in('proyecto_id', filtros.proyectos)
    if (filtros.montoMinimo) queryPagos = queryPagos.gte('valor_pactado', filtros.montoMinimo)
    if (filtros.montoMaximo) queryPagos = queryPagos.lte('valor_pactado', filtros.montoMaximo)

    const { data: pagosRaw } = await queryPagos

    // Obtener evidencias con filtros
    let queryEvidencias = supabase
      .from('evidencias_proyecto')
      .select(`
        id,
        nombre_archivo,
        descripcion,
        tipo_evidencia,
        fecha_actividad,
        proyecto_id,
        url_archivo,
        tamano_archivo
      `)

    if (fechaInicio) queryEvidencias = queryEvidencias.gte('fecha_actividad', fechaInicio)
    if (fechaFin) queryEvidencias = queryEvidencias.lte('fecha_actividad', fechaFin)
    if (filtros.proyectos?.length) queryEvidencias = queryEvidencias.in('proyecto_id', filtros.proyectos)

    const { data: evidenciasRaw } = await queryEvidencias

    // Crear un mapa de proyectos para consulta rápida
    const proyectosMap = new Map(proyectos?.map(p => [p.id, p.nombre]) || [])

    // Procesar y estructurar los datos
    const gastos: GastoCompleto[] = gastosRaw?.map(g => ({
      id: g.id,
      concepto: g.descripcion,
      monto: g.monto,
      categoria: g.tipo_gasto,
      fecha_gasto: g.fecha_gasto,
      proyecto_nombre: proyectosMap.get(g.proyecto_id) || 'Sin proyecto',
      proyecto_id: g.proyecto_id,
      evidencia_url: g.evidencia_url || undefined
    })) || []

    const pagos: PagoCompleto[] = pagosRaw?.map(p => ({
      id: p.id,
      trabajador_nombre: `Trabajador ${p.trabajador_id}`,
      monto: p.valor_pactado,
      concepto: p.tipo_labor,
      fecha_pago: p.fecha_pago,
      proyecto_nombre: proyectosMap.get(p.proyecto_id) || 'Sin proyecto',
      proyecto_id: p.proyecto_id,
      horas_trabajadas: p.horas_trabajadas || undefined
    })) || []

    const evidencias: EvidenciaCompleta[] = evidenciasRaw?.map(e => ({
      id: e.id,
      titulo: e.nombre_archivo,
      descripcion: e.descripcion,
      tipo: e.tipo_evidencia,
      fecha_subida: e.fecha_actividad,
      proyecto_nombre: proyectosMap.get(e.proyecto_id) || 'Sin proyecto',
      proyecto_id: e.proyecto_id,
      url: e.url_archivo,
      tamano: e.tamano_archivo
    })) || []

    // Calcular estadísticas por proyecto
    const proyectosCompletos: ProyectoCompleto[] = proyectos?.map(proyecto => {
      const gastosProyecto = gastos.filter(g => g.proyecto_id === proyecto.id)
      const pagosProyecto = pagos.filter(p => p.proyecto_id === proyecto.id)
      const evidenciasProyecto = evidencias.filter(e => e.proyecto_id === proyecto.id)

      return {
        ...proyecto,
        gastos_totales: gastosProyecto.reduce((sum, g) => sum + g.monto, 0),
        pagos_totales: pagosProyecto.reduce((sum, p) => sum + p.monto, 0),
        evidencias_count: evidenciasProyecto.length
      }
    }) || []

    // Calcular resumen general
    const totalProyectos = proyectosCompletos.length
    const proyectosActivos = proyectosCompletos.filter(p => p.estado === 'activo').length
    const presupuestoTotal = proyectosCompletos.reduce((sum, p) => sum + (p.presupuesto || 0), 0)
    const gastosTotal = gastos.reduce((sum, g) => sum + g.monto, 0)
    const pagosTotal = pagos.reduce((sum, p) => sum + p.monto, 0)
    const evidenciasTotal = evidencias.length
    const eficienciaPresupuestal = presupuestoTotal > 0 ? (gastosTotal / presupuestoTotal) * 100 : 0

    const resumen: ResumenGeneral = {
      totalProyectos,
      proyectosActivos,
      presupuestoTotal,
      gastosTotal,
      pagosTotal,
      evidenciasTotal,
      eficienciaPresupuestal,
      periodoInicio: fechaInicio || 'Sin límite',
      periodoFin: fechaFin || 'Sin límite'
    }

    return {
      proyectos: proyectosCompletos,
      gastos,
      pagos,
      evidencias,
      resumen
    }

  } catch (error) {
    console.error('Error al obtener datos consolidados:', error)
    throw new Error('Error al cargar los datos para el reporte')
  }
}

/**
 * Genera un reporte consolidado en formato PDF
 */
export async function generarReportePDF(
  datos: DatosConsolidados,
  opciones: {
    titulo: string
    incluirGraficos?: boolean
    incluirResumen?: boolean
    incluirDetalles?: boolean
    agruparPor?: 'proyecto' | 'fecha' | 'categoria' | 'trabajador'
  }
): Promise<Blob> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  let yPosition = 20

  // Configuración de colores corporativos
  const colorPrimario: [number, number, number] = [225, 29, 72] // #e11d48
  const colorSecundario: [number, number, number] = [37, 99, 235] // #2563eb
  const colorTexto: [number, number, number] = [51, 51, 51]

  // Función auxiliar para verificar si necesita nueva página
  const checkNewPage = (neededSpace: number) => {
    if (yPosition + neededSpace > pageHeight - 20) {
      doc.addPage()
      yPosition = 20
    }
  }

  // Función auxiliar para formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Encabezado del documento
  doc.setFillColor(...colorPrimario)
  doc.rect(0, 0, pageWidth, 30, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('CORPORACIÓN CULTURAL CÚCUTA', 20, 20)
  
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(opciones.titulo, 20, 28)

  yPosition = 45

  // Información del reporte
  doc.setTextColor(...colorTexto)
  doc.setFontSize(10)
  doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 20, yPosition)
  doc.text(`Período: ${datos.resumen.periodoInicio} - ${datos.resumen.periodoFin}`, pageWidth - 80, yPosition)
  
  yPosition += 15

  // Resumen ejecutivo
  if (opciones.incluirResumen) {
    checkNewPage(60)
    
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...colorPrimario)
    doc.text('RESUMEN EJECUTIVO', 20, yPosition)
    yPosition += 10

    doc.setFontSize(10)
    doc.setTextColor(...colorTexto)
    doc.setFont('helvetica', 'normal')

    const resumenTexto = [
      `Total de proyectos: ${datos.resumen.totalProyectos} (${datos.resumen.proyectosActivos} activos)`,
      `Presupuesto total asignado: ${formatCurrency(datos.resumen.presupuestoTotal)}`,
      `Total de gastos ejecutados: ${formatCurrency(datos.resumen.gastosTotal)}`,
      `Total de pagos realizados: ${formatCurrency(datos.resumen.pagosTotal)}`,
      `Eficiencia presupuestal: ${datos.resumen.eficienciaPresupuestal.toFixed(1)}%`,
      `Documentos de evidencia: ${datos.resumen.evidenciasTotal}`
    ]

    resumenTexto.forEach(texto => {
      doc.text(texto, 25, yPosition)
      yPosition += 6
    })

    yPosition += 10
  }

  // Detalles por módulo
  if (opciones.incluirDetalles) {
    // Sección de Proyectos
    if (datos.proyectos.length > 0) {
      checkNewPage(40)
      
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...colorSecundario)
      doc.text('PROYECTOS', 20, yPosition)
      yPosition += 10

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...colorTexto)

      // Encabezados de tabla
      doc.setFont('helvetica', 'bold')
      doc.text('Proyecto', 20, yPosition)
      doc.text('Estado', 80, yPosition)
      doc.text('Presupuesto', 120, yPosition)
      doc.text('Gastos', 160, yPosition)
      yPosition += 8

      doc.setFont('helvetica', 'normal')
      datos.proyectos.slice(0, 10).forEach(proyecto => {
        checkNewPage(8)
        doc.text(proyecto.nombre.substring(0, 25), 20, yPosition)
        doc.text(proyecto.estado, 80, yPosition)
        doc.text(formatCurrency(proyecto.presupuesto || 0), 120, yPosition)
        doc.text(formatCurrency(proyecto.gastos_totales), 160, yPosition)
        yPosition += 6
      })

      yPosition += 10
    }

    // Sección de Gastos Principales
    if (datos.gastos.length > 0) {
      checkNewPage(40)
      
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...colorSecundario)
      doc.text('PRINCIPALES GASTOS', 20, yPosition)
      yPosition += 10

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...colorTexto)

      // Encabezados
      doc.setFont('helvetica', 'bold')
      doc.text('Concepto', 20, yPosition)
      doc.text('Categoría', 80, yPosition)
      doc.text('Monto', 130, yPosition)
      doc.text('Fecha', 160, yPosition)
      yPosition += 8

      doc.setFont('helvetica', 'normal')
      datos.gastos
        .sort((a, b) => b.monto - a.monto)
        .slice(0, 15)
        .forEach(gasto => {
          checkNewPage(8)
          doc.text(gasto.concepto.substring(0, 20), 20, yPosition)
          doc.text(gasto.categoria, 80, yPosition)
          doc.text(formatCurrency(gasto.monto), 130, yPosition)
          doc.text(new Date(gasto.fecha_gasto).toLocaleDateString('es-ES'), 160, yPosition)
          yPosition += 6
        })

      yPosition += 10
    }
  }

  // Pie de página
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 30, pageHeight - 10)
    doc.text('SiGeCul - Sistema de Gestión Cultural', 20, pageHeight - 10)
  }

  return doc.output('blob')
}

/**
 * Genera un reporte consolidado en formato Excel
 */
export async function generarReporteExcel(
  datos: DatosConsolidados,
  opciones: {
    titulo: string
    incluirGraficos?: boolean
    incluirResumen?: boolean
    incluirDetalles?: boolean
    agruparPor?: 'proyecto' | 'fecha' | 'categoria' | 'trabajador'
  }
): Promise<Blob> {
  const workbook = XLSX.utils.book_new()

  // Hoja de resumen
  if (opciones.incluirResumen) {
    const resumenData = [
      ['RESUMEN EJECUTIVO'],
      [''],
      ['Métrica', 'Valor'],
      ['Total de proyectos', datos.resumen.totalProyectos],
      ['Proyectos activos', datos.resumen.proyectosActivos],
      ['Presupuesto total', datos.resumen.presupuestoTotal],
      ['Gastos ejecutados', datos.resumen.gastosTotal],
      ['Pagos realizados', datos.resumen.pagosTotal],
      ['Eficiencia presupuestal (%)', datos.resumen.eficienciaPresupuestal.toFixed(2)],
      ['Total evidencias', datos.resumen.evidenciasTotal],
      [''],
      ['Período del reporte'],
      ['Fecha inicio', datos.resumen.periodoInicio],
      ['Fecha fin', datos.resumen.periodoFin],
      ['Fecha generación', new Date().toLocaleDateString('es-ES')]
    ]

    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData)
    
    // Formatear la hoja de resumen
    wsResumen['!cols'] = [{ wch: 25 }, { wch: 20 }]
    
    XLSX.utils.book_append_sheet(workbook, wsResumen, 'Resumen')
  }

  // Hoja de proyectos
  if (datos.proyectos.length > 0) {
    const proyectosData = [
      ['ID', 'Nombre', 'Estado', 'Responsable', 'Presupuesto', 'Gastos Totales', 'Pagos Totales', 'Evidencias', 'Fecha Inicio', 'Fecha Fin']
    ]

    datos.proyectos.forEach(proyecto => {
      proyectosData.push([
        proyecto.id,
        proyecto.nombre,
        proyecto.estado,
        proyecto.responsable,
        proyecto.presupuesto?.toString() || '0',
        proyecto.gastos_totales.toString(),
        proyecto.pagos_totales.toString(),
        proyecto.evidencias_count.toString(),
        proyecto.fecha_inicio,
        proyecto.fecha_fin || ''
      ])
    })

    const wsProyectos = XLSX.utils.aoa_to_sheet(proyectosData)
    wsProyectos['!cols'] = [
      { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 20 }, 
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, 
      { wch: 12 }, { wch: 12 }
    ]
    
    XLSX.utils.book_append_sheet(workbook, wsProyectos, 'Proyectos')
  }

  // Hoja de gastos
  if (datos.gastos.length > 0) {
    const gastosData = [
      ['ID', 'Concepto', 'Monto', 'Categoría', 'Fecha', 'Proyecto', 'Evidencia']
    ]

    datos.gastos.forEach(gasto => {
      gastosData.push([
        gasto.id,
        gasto.concepto,
        gasto.monto.toString(),
        gasto.categoria,
        gasto.fecha_gasto,
        gasto.proyecto_nombre,
        gasto.evidencia_url ? 'Sí' : 'No'
      ])
    })

    const wsGastos = XLSX.utils.aoa_to_sheet(gastosData)
    wsGastos['!cols'] = [
      { wch: 15 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, 
      { wch: 12 }, { wch: 25 }, { wch: 10 }
    ]
    
    XLSX.utils.book_append_sheet(workbook, wsGastos, 'Gastos')
  }

  // Hoja de pagos
  if (datos.pagos.length > 0) {
    const pagosData = [
      ['ID', 'Trabajador', 'Monto', 'Concepto', 'Fecha', 'Proyecto', 'Horas']
    ]

    datos.pagos.forEach(pago => {
      pagosData.push([
        pago.id,
        pago.trabajador_nombre,
        pago.monto.toString(),
        pago.concepto,
        pago.fecha_pago,
        pago.proyecto_nombre,
        (pago.horas_trabajadas || 0).toString()
      ])
    })

    const wsPagos = XLSX.utils.aoa_to_sheet(pagosData)
    wsPagos['!cols'] = [
      { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 30 }, 
      { wch: 12 }, { wch: 25 }, { wch: 8 }
    ]
    
    XLSX.utils.book_append_sheet(workbook, wsPagos, 'Pagos')
  }

  // Hoja de evidencias
  if (datos.evidencias.length > 0) {
    const evidenciasData = [
      ['ID', 'Título', 'Tipo', 'Fecha Subida', 'Proyecto', 'Tamaño (KB)']
    ]

    datos.evidencias.forEach(evidencia => {
      evidenciasData.push([
        evidencia.id,
        evidencia.titulo,
        evidencia.tipo,
        evidencia.fecha_subida,
        evidencia.proyecto_nombre,
        evidencia.tamano.toString()
      ])
    })

    const wsEvidencias = XLSX.utils.aoa_to_sheet(evidenciasData)
    wsEvidencias['!cols'] = [
      { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 12 }, 
      { wch: 25 }, { wch: 12 }
    ]
    
    XLSX.utils.book_append_sheet(workbook, wsEvidencias, 'Evidencias')
  }

  // Convertir a blob
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
