"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { useEvidenciasUpdate } from "./evidencias-update-context"
import { Camera, Eye, Loader2, Image, Video, FileText, Mic, File, Calendar, FolderOpen } from "lucide-react"
import type { EvidenciaProyecto } from "@/lib/types"

interface EvidenciaConProyecto extends EvidenciaProyecto {
  proyecto?: {
    id: string
    nombre: string
  }
}

export function EvidenciasRecientes() {
  const { user } = useAuth()
  const { lastUpdate } = useEvidenciasUpdate()
  const [evidencias, setEvidencias] = useState<EvidenciaConProyecto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchEvidenciasRecientes()
    }
  }, [user, lastUpdate])

  const fetchEvidenciasRecientes = async () => {
    try {
      setLoading(true)

      // Obtener proyectos del supervisor
      const { data: proyectos, error: proyectosError } = await supabase
        .from("proyectos")
        .select("id")
        .eq("supervisor_id", user?.id)

      if (proyectosError) throw proyectosError

      if (!proyectos || proyectos.length === 0) {
        setEvidencias([])
        return
      }

      const proyectoIds = proyectos.map(p => p.id)

      // Obtener evidencias recientes con información del proyecto
      const { data: evidenciasData, error: evidenciasError } = await supabase
        .from("evidencias_proyecto")
        .select(`
          *,
          proyecto:proyectos!inner(
            id,
            nombre
          )
        `)
        .in("proyecto_id", proyectoIds)
        .order("created_at", { ascending: false })
        .limit(5)

      if (evidenciasError) throw evidenciasError

      setEvidencias(evidenciasData || [])
    } catch (error) {
      console.error("Error al cargar evidencias recientes:", error)
    } finally {
      setLoading(false)
    }
  }

  const getIconoPorTipo = (tipo: string) => {
    const tipoLower = tipo.toLowerCase()
    
    if (tipoLower.includes('imagen') || tipoLower.includes('foto') || tipoLower.includes('jpg') || tipoLower.includes('png') || tipoLower.includes('jpeg')) {
      return <Image className="h-4 w-4 text-blue-500" />
    } else if (tipoLower.includes('video') || tipoLower.includes('mp4') || tipoLower.includes('avi') || tipoLower.includes('mov')) {
      return <Video className="h-4 w-4 text-green-500" />
    } else if (tipoLower.includes('documento') || tipoLower.includes('pdf') || tipoLower.includes('doc') || tipoLower.includes('txt')) {
      return <FileText className="h-4 w-4 text-orange-500" />
    } else if (tipoLower.includes('audio') || tipoLower.includes('mp3') || tipoLower.includes('wav') || tipoLower.includes('m4a')) {
      return <Mic className="h-4 w-4 text-purple-500" />
    } else {
      return <File className="h-4 w-4 text-gray-500" />
    }
  }

  const getBadgeColor = (tipo: string) => {
    const tipoLower = tipo.toLowerCase()
    
    if (tipoLower.includes('imagen') || tipoLower.includes('foto')) {
      return 'bg-blue-100 text-blue-800'
    } else if (tipoLower.includes('video')) {
      return 'bg-green-100 text-green-800'
    } else if (tipoLower.includes('documento') || tipoLower.includes('pdf')) {
      return 'bg-orange-100 text-orange-800'
    } else if (tipoLower.includes('audio')) {
      return 'bg-purple-100 text-purple-800'
    } else {
      return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (evidencias.length === 0) {
    return (
      <div className="text-center py-8">
        <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay evidencias registradas</h3>
        <p className="text-gray-500 mb-4">Comienza subiendo la primera evidencia de tus proyectos</p>
        <Link href="/dashboard/evidencias/nuevo">
          <Button className="bg-red-600 hover:bg-red-700">Subir Primera Evidencia</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {evidencias.map((evidencia) => (
        <div key={evidencia.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge className={getBadgeColor(evidencia.tipo_evidencia)}>
                <span className="flex items-center gap-1">
                  {getIconoPorTipo(evidencia.tipo_evidencia)}
                  {evidencia.tipo_evidencia}
                </span>
              </Badge>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">{evidencia.nombre_archivo}</h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                <span>{evidencia.proyecto?.nombre || "Proyecto no encontrado"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(evidencia.fecha_actividad).toLocaleDateString()}</span>
              </div>
              {evidencia.descripcion && (
                <div className="col-span-2 md:col-span-1">
                  <span className="truncate">{evidencia.descripcion}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-500">{new Date(evidencia.created_at).toLocaleDateString()}</p>
            </div>

            <Link href={`/dashboard/proyectos/${evidencia.proyecto_id}`}>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                Ver
              </Button>
            </Link>
          </div>
        </div>
      ))}

      {evidencias.length === 5 && (
        <div className="text-center pt-4">
          <Link href="/dashboard/evidencias">
            <Button variant="outline">Ver Todas las Evidencias</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
