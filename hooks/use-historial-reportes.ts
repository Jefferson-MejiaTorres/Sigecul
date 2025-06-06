"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { HistorialReporte } from "@/lib/types"

export function useHistorialReportes() {
  const [reportes, setReportes] = useState<HistorialReporte[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargarHistorialReportes()
  }, [])

  const cargarHistorialReportes = async () => {
    try {
      setCargando(true)
      setError(null)

      const { data, error: errorSupabase } = await supabase
        .from('historial_reportes')
        .select('*')
        .order('fecha_creacion', { ascending: false })

      if (errorSupabase) {
        throw errorSupabase
      }

      setReportes(data || [])
    } catch (err) {
      console.error('Error al cargar historial de reportes:', err)
      setError('Error al cargar el historial de reportes')
    } finally {
      setCargando(false)
    }
  }

  const crearReporte = async (
    nombre: string,
    descripcion: string | null,
    tipo: HistorialReporte['tipo'],
    formato: HistorialReporte['formato'],
    creadoPor: string,
    modulos: string[],
    proyectosIncluidos: number,
    parametrosGeneracion?: Record<string, any>
  ): Promise<string | null> => {
    try {
      const { data, error: errorSupabase } = await supabase
        .from('historial_reportes')
        .insert({
          nombre,
          descripcion,
          tipo,
          formato,
          creado_por: creadoPor,
          modulos,
          proyectos_incluidos: proyectosIncluidos,
          parametros_generacion: parametrosGeneracion || null,
          estado: 'procesando',
          descargas: 0,
          tamaño_mb: 0
        })
        .select('id')
        .single()

      if (errorSupabase) {
        throw errorSupabase
      }

      // Recargar lista
      await cargarHistorialReportes()
      
      return data?.id || null
    } catch (err) {
      console.error('Error al crear reporte:', err)
      setError('Error al crear el reporte')
      return null
    }
  }

  const actualizarEstadoReporte = async (
    reporteId: string,
    estado: HistorialReporte['estado'],
    urlArchivo?: string,
    tamañoMB?: number
  ) => {
    try {
      const actualizacion: any = { estado }
      
      if (urlArchivo !== undefined) {
        actualizacion.url_archivo = urlArchivo
      }
      
      if (tamañoMB !== undefined) {
        actualizacion.tamaño_mb = tamañoMB
      }

      const { error: errorSupabase } = await supabase
        .from('historial_reportes')
        .update(actualizacion)
        .eq('id', reporteId)

      if (errorSupabase) {
        throw errorSupabase
      }

      // Actualizar estado local
      setReportes(prev => prev.map(reporte => 
        reporte.id === reporteId 
          ? { ...reporte, estado, url_archivo: urlArchivo || reporte.url_archivo, tamaño_mb: tamañoMB || reporte.tamaño_mb }
          : reporte
      ))
    } catch (err) {
      console.error('Error al actualizar estado del reporte:', err)
      setError('Error al actualizar el estado del reporte')
    }
  }

  const incrementarDescargas = async (reporteId: string) => {
    try {      // Obtener el valor actual y incrementar
      const { data: reporteActual } = await supabase
        .from('historial_reportes')
        .select('descargas')
        .eq('id', reporteId)
        .single()

      const nuevasDescargas = (reporteActual?.descargas || 0) + 1

      const { error: errorSupabase } = await supabase
        .from('historial_reportes')
        .update({ descargas: nuevasDescargas })
        .eq('id', reporteId)

      if (errorSupabase) {
        throw errorSupabase
      }

      // Actualizar estado local
      setReportes(prev => prev.map(reporte => 
        reporte.id === reporteId 
          ? { ...reporte, descargas: reporte.descargas + 1 }
          : reporte
      ))
    } catch (err) {
      console.error('Error al incrementar descargas:', err)
    }
  }

  const eliminarReporte = async (reporteId: string) => {
    try {
      const { error: errorSupabase } = await supabase
        .from('historial_reportes')
        .delete()
        .eq('id', reporteId)

      if (errorSupabase) {
        throw errorSupabase
      }

      // Actualizar estado local
      setReportes(prev => prev.filter(reporte => reporte.id !== reporteId))
      
      return true
    } catch (err) {
      console.error('Error al eliminar reporte:', err)
      setError('Error al eliminar el reporte')
      return false
    }
  }

  const filtrarReportes = (
    reportes: HistorialReporte[],
    filtroTexto: string,
    filtroTipo: string,
    filtroEstado: string
  ) => {
    return reportes.filter(reporte => {
      const coincideTexto = reporte.nombre.toLowerCase().includes(filtroTexto.toLowerCase()) ||
                           reporte.descripcion?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
                           reporte.creado_por.toLowerCase().includes(filtroTexto.toLowerCase())
      
      const coincideTipo = filtroTipo === 'todos' || reporte.tipo === filtroTipo
      const coincideEstado = filtroEstado === 'todos' || reporte.estado === filtroEstado
      
      return coincideTexto && coincideTipo && coincideEstado
    })
  }

  const ordenarReportes = (
    reportes: HistorialReporte[],
    criterio: string
  ) => {
    return [...reportes].sort((a, b) => {
      switch (criterio) {
        case 'fecha_desc':
          return new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime()
        case 'fecha_asc':
          return new Date(a.fecha_creacion).getTime() - new Date(b.fecha_creacion).getTime()
        case 'nombre_asc':
          return a.nombre.localeCompare(b.nombre)
        case 'descargas_desc':
          return b.descargas - a.descargas
        case 'tamaño_desc':
          return b.tamaño_mb - a.tamaño_mb
        default:
          return 0
      }
    })
  }

  return {
    reportes,
    cargando,
    error,
    cargarHistorialReportes,
    crearReporte,
    actualizarEstadoReporte,
    incrementarDescargas,
    eliminarReporte,
    filtrarReportes,
    ordenarReportes
  }
}
