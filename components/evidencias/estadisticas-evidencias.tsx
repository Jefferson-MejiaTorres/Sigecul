"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { useEvidenciasUpdate } from "./evidencias-update-context"
import { Camera, Image, Video, FileText, Mic, File, Loader2 } from "lucide-react"

interface EstadisticasEvidencias {
  totalEvidencias: number
  imagenes: number
  videos: number
  documentos: number
  audios: number
  otros: number
}

export function EstadisticasEvidencias() {
  const { user } = useAuth()
  const { lastUpdate } = useEvidenciasUpdate()
  const [stats, setStats] = useState<EstadisticasEvidencias>({
    totalEvidencias: 0,
    imagenes: 0,
    videos: 0,
    documentos: 0,
    audios: 0,
    otros: 0,
  })
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user, lastUpdate])

  const fetchStats = async () => {
    try {
      setLoading(true)

      // Obtener proyectos del supervisor
      const { data: proyectos, error: proyectosError } = await supabase
        .from("proyectos")
        .select("id")
        .eq("supervisor_id", user?.id)

      if (proyectosError) throw proyectosError

      if (!proyectos || proyectos.length === 0) {
        setStats({
          totalEvidencias: 0,
          imagenes: 0,
          videos: 0,
          documentos: 0,
          audios: 0,
          otros: 0,
        })
        return
      }

      const proyectoIds = proyectos.map(p => p.id)

      // Obtener evidencias de esos proyectos
      const { data: evidencias, error: evidenciasError } = await supabase
        .from("evidencias_proyecto")
        .select("tipo_evidencia")
        .in("proyecto_id", proyectoIds)

      if (evidenciasError) throw evidenciasError      // Contar por tipo
      const stats = evidencias?.reduce(
        (acc, evidencia) => {
          acc.totalEvidencias++
          
          const tipo = evidencia.tipo_evidencia
          
          if (tipo === 'fotografia') {
            acc.imagenes++
          } else if (tipo === 'video') {
            acc.videos++
          } else if (tipo === 'documento' || tipo === 'lista_asistencia' || tipo === 'informe') {
            acc.documentos++
          } else if (tipo === 'audio') {
            acc.audios++
          } else {
            acc.otros++
          }
          
          return acc
        },
        {
          totalEvidencias: 0,
          imagenes: 0,
          videos: 0,
          documentos: 0,
          audios: 0,
          otros: 0,
        }
      ) || {
        totalEvidencias: 0,
        imagenes: 0,
        videos: 0,
        documentos: 0,
        audios: 0,
        otros: 0,
      }

      setStats(stats)
    } catch (error) {
      console.error("Error al cargar estadísticas de evidencias:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Evidencias</CardTitle>
          <Camera className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{stats.totalEvidencias}</div>
          <p className="text-xs text-muted-foreground">Archivos subidos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Imágenes</CardTitle>
          <Image className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.imagenes}</div>
          <p className="text-xs text-muted-foreground">Fotografías</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Videos</CardTitle>
          <Video className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.videos}</div>
          <p className="text-xs text-muted-foreground">Grabaciones</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Documentos</CardTitle>
          <FileText className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.documentos}</div>
          <p className="text-xs text-muted-foreground">Archivos PDF</p>
        </CardContent>
      </Card>
    </div>
  )
}
