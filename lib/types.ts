// Tipos actualizados y sincronizados con el esquema real de la base de datos

export interface Usuario {
  id: string // uuid
  email: string
  password_hash: string | null // puede ser null
  nombre: string
  rol: "supervisor" | "admin" | "president" | string // por si hay otros roles
  activo: boolean | null // puede ser null
  created_at: string // timestamp with time zone
  updated_at: string // timestamp with time zone
  auth_user_id: string | null // uuid, puede ser null
}

export interface Proyecto {
  id: string // uuid
  nombre: string
  descripcion: string | null
  presupuesto_total: number // numeric
  presupuesto_ejecutado: number | null // numeric, puede ser null
  fecha_inicio: string // date
  fecha_fin: string | null // date
  estado: "planificacion" | "activo" | "finalizado" | "cancelado" | string // por si hay otros estados
  supervisor_id: string | null // uuid
  ministerio_aprobacion: boolean | null // puede ser null
  created_at: string // timestamp with time zone
  updated_at: string // timestamp with time zone
}

export interface GastoProyecto {
  id: string // uuid
  proyecto_id: string | null // uuid
  tipo_gasto: string // character varying
  descripcion: string
  monto: number // numeric
  fecha_gasto: string // date
  responsable: string | null
  evidencia_url: string | null
  aprobado: boolean | null // puede ser null
  observaciones: string | null
  created_at: string // timestamp with time zone
  created_by: string | null // uuid
}

export interface PagoPersonal {
  id: string // uuid
  proyecto_id: string | null // uuid
  trabajador_id: string | null // uuid
  fecha_actividad: string // date
  tipo_labor: string
  horas_trabajadas: number | null // numeric
  valor_pactado: number // numeric
  estado_pago: string | null // character varying
  fecha_pago: string | null // date
  comprobante_url: string | null
  observaciones: string | null
  created_at: string // timestamp with time zone
  created_by: string | null // uuid
}

export interface Trabajador {
  id: string // uuid
  nombre: string
  cedula: string
  telefono: string | null
  email: string | null
  especialidad: string | null
  valor_hora: number | null // numeric
  activo: boolean | null // puede ser null
  created_at: string // timestamp with time zone
}

export interface EvidenciaProyecto {
  id: string // uuid
  proyecto_id: string | null // uuid
  tipo_evidencia: string // character varying
  nombre_archivo: string
  url_archivo: string
  fecha_actividad: string // date
  descripcion: string | null
  tamaño_archivo: number | null // integer
  created_at: string // timestamp with time zone
  created_by: string | null // uuid
}

export interface InformeFinal {
  id: string // uuid
  proyecto_id: string | null // uuid
  titulo: string
  contenido: string
  total_gastos: number | null // numeric
  total_participantes: number | null // integer
  observaciones_generales: string | null
  estado: string | null // character varying
  fecha_entrega: string | null // date
  archivo_url: string | null
  created_at: string // timestamp with time zone
  created_by: string | null // uuid
}

export interface HistorialReporte {
  id: string // uuid
  nombre: string
  descripcion: string | null
  tipo: "ejecutivo" | "financiero" | "proyectos" | "personalizado"
  formato: "pdf" | "excel" | "ambos"
  fecha_creacion: string // timestamp with time zone
  tamaño_mb: number // numeric
  estado: "completado" | "procesando" | "error"
  creado_por: string
  descargas: number // integer
  modulos: string[] // text array
  proyectos_incluidos: number // integer
  url_archivo: string | null
  parametros_generacion: Record<string, any> | null // jsonb
  created_at: string // timestamp with time zone
  updated_at: string // timestamp with time zone
}
