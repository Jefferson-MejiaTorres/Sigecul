import { useState } from 'react'
import { 
  obtenerDatosConsolidados, 
  generarReportePDF, 
  generarReporteExcel,
  type FiltrosReporte,
  type DatosConsolidados 
} from '@/lib/export-reportes'
import { supabase } from '@/lib/supabase'

export interface OpcionesReporte {
  titulo: string
  descripcion?: string
  formato: 'pdf' | 'excel' | 'ambos'
  modulos: string[]
  incluirGraficos: boolean
  incluirResumen: boolean
  incluirDetalles: boolean
  agruparPor: 'proyecto' | 'fecha' | 'categoria' | 'trabajador'
}

export function useGenerarReportes() {
  const [generando, setGenerando] = useState(false)
  const [progreso, setProgreso] = useState(0)

  const generarReporte = async (
    opciones: OpcionesReporte,
    filtros: FiltrosReporte = {}
  ): Promise<{ success: boolean; error?: string; archivos?: { nombre: string; blob: Blob; tipo: string }[] }> => {
    try {
      setGenerando(true)
      setProgreso(0)

      // Paso 1: Obtener datos (20%)
      setProgreso(20)
      const datos = await obtenerDatosConsolidados(filtros)
      
      if (!datos || (!datos.proyectos.length && !datos.gastos.length && !datos.pagos.length)) {
        throw new Error('No se encontraron datos para generar el reporte con los filtros aplicados')
      }

      // Paso 2: Validar módulos seleccionados (30%)
      setProgreso(30)
      const datosModulos = validarModulosSeleccionados(datos, opciones.modulos)

      const archivos: { nombre: string; blob: Blob; tipo: string }[] = []
      const timestamp = new Date().toISOString().slice(0, 10)
      const nombreBase = `${opciones.titulo.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}`

      // Paso 3: Generar PDF si es necesario (50-75%)
      if (opciones.formato === 'pdf' || opciones.formato === 'ambos') {
        setProgreso(50)
        const pdfBlob = await generarReportePDF(datosModulos, {
          titulo: opciones.titulo,
          incluirGraficos: opciones.incluirGraficos,
          incluirResumen: opciones.incluirResumen,
          incluirDetalles: opciones.incluirDetalles,
          agruparPor: opciones.agruparPor
        })
        
        archivos.push({
          nombre: `${nombreBase}.pdf`,
          blob: pdfBlob,
          tipo: 'application/pdf'
        })
        setProgreso(75)
      }

      // Paso 4: Generar Excel si es necesario (75-90%)
      if (opciones.formato === 'excel' || opciones.formato === 'ambos') {
        setProgreso(opciones.formato === 'excel' ? 50 : 75)
        const excelBlob = await generarReporteExcel(datosModulos, {
          titulo: opciones.titulo,
          incluirGraficos: opciones.incluirGraficos,
          incluirResumen: opciones.incluirResumen,
          incluirDetalles: opciones.incluirDetalles
        })
        
        archivos.push({
          nombre: `${nombreBase}.xlsx`,
          blob: excelBlob,
          tipo: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
        setProgreso(90)
      }

      // Paso 5: Descargar archivos (90-100%)
      for (const archivo of archivos) {
        await descargarArchivo(archivo.blob, archivo.nombre, archivo.tipo)
      }
      
      setProgreso(100)      // Guardar en historial
      await guardarEnHistorial({
        nombre: opciones.titulo,
        descripcion: opciones.descripcion,
        formato: opciones.formato,
        modulos: opciones.modulos,
        tamaño: archivos.reduce((sum, a) => sum + a.blob.size, 0) / (1024 * 1024), // Convertir a MB
        fechaCreacion: new Date(),
        filtros,
        proyectosIncluidos: datosModulos.proyectos.length
      })

      return { success: true, archivos }

    } catch (error) {
      console.error('Error al generar reporte:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido al generar el reporte' 
      }
    } finally {
      setGenerando(false)
      setProgreso(0)
    }
  }

  return {
    generarReporte,
    generando,
    progreso
  }
}

/**
 * Filtra los datos según los módulos seleccionados
 */
function validarModulosSeleccionados(datos: DatosConsolidados, modulos: string[]): DatosConsolidados {
  return {
    proyectos: modulos.includes('proyectos') ? datos.proyectos : [],
    gastos: modulos.includes('gastos') ? datos.gastos : [],
    pagos: modulos.includes('pagos') ? datos.pagos : [],
    evidencias: modulos.includes('evidencias') ? datos.evidencias : [],
    resumen: datos.resumen
  }
}

/**
 * Descarga un archivo usando la API del navegador
 */
async function descargarArchivo(blob: Blob, nombre: string, tipo: string): Promise<void> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = nombre
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Limpiar la URL después de un breve delay
    setTimeout(() => {
      URL.revokeObjectURL(url)
      resolve()
    }, 100)
  })
}

/**
 * Guarda el reporte en el historial usando Supabase
 */
async function guardarEnHistorial(reporte: {
  nombre: string
  descripcion?: string
  formato: 'pdf' | 'excel' | 'ambos'
  modulos: string[]
  tamaño: number
  fechaCreacion: Date
  filtros: FiltrosReporte
  proyectosIncluidos: number
}): Promise<void> {
  try {
    // Obtener usuario actual (esto debería venir del contexto de autenticación)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.warn('No hay usuario autenticado para guardar en historial')
      return
    }

    // Determinar tipo de reporte basado en filtros y módulos
    let tipoReporte: 'ejecutivo' | 'financiero' | 'proyectos' | 'personalizado' = 'personalizado'
    
    if (reporte.modulos.length >= 3) {
      tipoReporte = 'ejecutivo'
    } else if (reporte.modulos.includes('gastos') && reporte.modulos.includes('pagos')) {
      tipoReporte = 'financiero'
    } else if (reporte.modulos.includes('proyectos')) {
      tipoReporte = 'proyectos'
    }

    const { error } = await supabase
      .from('historial_reportes')
      .insert({
        nombre: reporte.nombre,
        descripcion: reporte.descripcion || null,
        tipo: tipoReporte,
        formato: reporte.formato,
        creado_por: user.email || 'Usuario desconocido',
        modulos: reporte.modulos,
        proyectos_incluidos: reporte.proyectosIncluidos,
        parametros_generacion: reporte.filtros,
        estado: 'completado',
        tamaño_mb: reporte.tamaño,
        descargas: 0
      })

    if (error) {
      throw error
    }

    console.log('Reporte guardado en historial:', reporte.nombre)
  } catch (error) {
    console.error('Error al guardar en historial:', error)
  }
}
