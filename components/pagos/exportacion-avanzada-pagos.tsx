// Componente para opciones avanzadas de exportación de pagos
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Loader2, Settings } from "lucide-react"
import { useExportarPagos } from "@/hooks/use-exportar-pagos"

interface OpcionesExportacion {
  formato: "csv" | "excel" | "pdf"
  incluirProyectos: boolean
  incluirPagados: boolean
  incluirPendientes: boolean
  rangoFechas: "todos" | "mes" | "trimestre" | "año"
}

export function ExportacionAvanzadaPagos() {
  const { exportarCSV, exportarExcel, exportarPDF, exportando } = useExportarPagos()
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [opciones, setOpciones] = useState<OpcionesExportacion>({
    formato: "pdf",
    incluirProyectos: true,
    incluirPagados: true,
    incluirPendientes: true,
    rangoFechas: "todos"
  })

  const handleExportar = async () => {
    try {
      if (opciones.formato === "pdf") {
        await exportarPDF()
      } else if (opciones.formato === "excel") {
        await exportarExcel()
      } else {
        await exportarCSV()
      }
      setDialogAbierto(false)
    } catch (error) {
      console.error("Error en exportación:", error)
    }
  }

  return (
    <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Opciones
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Opciones de Exportación - Pagos</DialogTitle>
          <DialogDescription>
            Personaliza los datos de pagos que deseas exportar
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Formato de archivo */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Formato de archivo</Label>
            <RadioGroup
              value={opciones.formato}
              onValueChange={(value: "csv" | "excel" | "pdf") => 
                setOpciones(prev => ({ ...prev, formato: value }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv">CSV (Exportación rápida)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="flex items-center gap-2">
                  <span className="text-green-600">📊</span>
                  Excel (Reporte profesional completo)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2">
                  <span className="text-red-600">📄</span>
                  PDF (Reporte corporativo con gráficos)
                </Label>
              </div>
            </RadioGroup>
            
            {/* Descripción del formato Excel */}
            {opciones.formato === "excel" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                <h4 className="text-sm font-medium text-green-800 mb-2">🎯 Reporte Excel Profesional</h4>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• 📊 Reporte detallado con todos los pagos</li>
                  <li>• 📈 Resumen por proyecto con estadísticas</li>
                  <li>• 📊 Análisis por tipo de labor</li>
                  <li>• 📋 Estadísticas generales y KPIs</li>
                  <li>• 🎨 Columnas auto-ajustadas y formato profesional</li>
                </ul>
              </div>
            )}
            
            {/* Descripción del formato PDF */}
            {opciones.formato === "pdf" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                <h4 className="text-sm font-medium text-red-800 mb-2">🏢 Reporte Corporativo PDF</h4>
                <ul className="text-xs text-red-700 space-y-1">
                  <li>• 🏢 Formato corporativo con logo CCC</li>
                  <li>• 📊 Gráficos visuales de distribución y estado</li>
                  <li>• 📋 Resumen ejecutivo con estadísticas clave</li>
                  <li>• 📄 Tabla detallada de pagos principales</li>
                  <li>• 🎨 Diseño profesional listo para presentar</li>
                </ul>
              </div>
            )}
          </div>

          {/* Estados a incluir */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Estados de pagos</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pagados"
                  checked={opciones.incluirPagados}
                  onCheckedChange={(checked) => 
                    setOpciones(prev => ({ ...prev, incluirPagados: !!checked }))}
                />
                <Label htmlFor="pagados">Pagos realizados</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pendientes"
                  checked={opciones.incluirPendientes}
                  onCheckedChange={(checked) => 
                    setOpciones(prev => ({ ...prev, incluirPendientes: !!checked }))}
                />
                <Label htmlFor="pendientes">Pagos pendientes</Label>
              </div>
            </div>
          </div>

          {/* Rango de fechas */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Rango de fechas</Label>
            <Select
              value={opciones.rangoFechas}
              onValueChange={(value: "todos" | "mes" | "trimestre" | "año") =>
                setOpciones(prev => ({ ...prev, rangoFechas: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los pagos</SelectItem>
                <SelectItem value="mes">Mes actual</SelectItem>
                <SelectItem value="trimestre">Trimestre actual</SelectItem>
                <SelectItem value="año">Año actual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Información adicional */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="proyectos"
                checked={opciones.incluirProyectos}
                onCheckedChange={(checked) => 
                  setOpciones(prev => ({ ...prev, incluirProyectos: !!checked }))}
              />
              <Label htmlFor="proyectos">Incluir información detallada de proyectos</Label>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={() => setDialogAbierto(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExportar}
            disabled={exportando || (!opciones.incluirPagados && !opciones.incluirPendientes)}
            className={
              opciones.formato === "pdf" 
                ? "bg-red-600 hover:bg-red-700" 
                : opciones.formato === "excel" 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-blue-600 hover:bg-blue-700"
            }
          >
            {exportando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                {opciones.formato === "pdf" 
                  ? "Crear Reporte PDF" 
                  : opciones.formato === "excel" 
                    ? "Crear Reporte Excel" 
                    : "Exportar CSV"
                }
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
