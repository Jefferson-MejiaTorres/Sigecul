import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, FileText, DollarSign, Users, BarChart3, Shield, Clock, Database, Sparkles } from "lucide-react"
import Header from "./partes/Header"
import Footer from "./partes/Footer"
import AnimacionesLogos from "./partes/AnimacionesLogos"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <AnimacionesLogos />
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Sparkles className="h-7 w-7 text-red-400 animate-pulse" />
            <Badge className="text-xl px-6 py-2 bg-red-100 text-red-700 font-bold shadow-md border-2 border-red-200 rounded-full relative transition-colors duration-200 hover:bg-red-50">
              Solución Integral para Gestión Cultural
            </Badge>
            <Sparkles className="h-7 w-7 text-red-400 animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Controla la Gestión de tus
            <span className="text-red-600 block drop-shadow-md">Proyectos Culturales</span>
          </h1>
          <p className="text-xl text-gray-700 mb-10 max-w-3xl mx-auto font-medium">
            Sistema especializado para la Corporación Cultural Cúcuta que centraliza el control de gastos, pagos al
            personal y evidencias de proyectos culturales y sociales.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-red-600 hover:bg-red-620 text-lg px-10 py-4 shadow-xl transition-all duration-200 hover:scale-105 focus:scale-95 focus:ring-2 focus:ring-red-300 group relative overflow-hidden">
                <span className="absolute left-0 top-0 w-full h-full bg-red-500 opacity-0 group-hover:opacity-10 transition-all duration-300 rounded-md" />
                <span className="z-10 relative">Acceder al Sistema</span>
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-10 py-4 border-2 border-red-200 text-black-700 hover:bg-red-50 hover:border-red-400 shadow transition-all duration-200 hover:scale-105 focus:scale-95 focus:ring-2 focus:ring-red-200 group relative overflow-hidden">
              <span className="absolute left-0 top-0 w-full h-full bg-red-100 opacity-0 group-hover:opacity-10 transition-all duration-300 rounded-md" />
              <span className="z-10 relative">Ver Demostración</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Problemas que Resolvemos</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              La gestión manual actual genera múltiples inconvenientes que afectan la eficiencia operativa
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-red-200 shadow-sm hover:shadow-lg transition-shadow bg-white/90">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Dispersión de Datos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Múltiples archivos Excel por proyecto sin conexión entre sí, dificultando la consolidación de
                  información.
                </p>
              </CardContent>
            </Card>
            <Card className="border-red-200 shadow-sm hover:shadow-lg transition-shadow bg-white/90">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5" />
                  Control Manual de Pagos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Gestión manual de pagos a trabajadores temporales con riesgo de duplicaciones y omisiones.
                </p>
              </CardContent>
            </Card>
            <Card className="border-red-200 shadow-sm hover:shadow-lg transition-shadow bg-white/90">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5" />
                  Reportes Lentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Generación manual de informes que requiere horas de trabajo y revisión de múltiples archivos.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Funcionalidades Principales</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Sistema completo diseñado específicamente para las necesidades de la Corporación Cultural Cúcuta
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover:shadow-xl transition-shadow bg-white/90 border-2 border-red-100">
              <CardHeader>
                <div className="mx-auto w-14 h-14 bg-red-100 rounded-lg flex items-center justify-center mb-4 shadow">
                  <DollarSign className="h-7 w-7 text-red-600" />
                </div>
                <CardTitle className="text-lg">Gestión de Gastos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Registro centralizado de todos los gastos por proyecto con categorización automática y evidencias
                  digitales.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-xl transition-shadow bg-white/90 border-2 border-red-100">
              <CardHeader>
                <div className="mx-auto w-14 h-14 bg-red-100 rounded-lg flex items-center justify-center mb-4 shadow">
                  <Users className="h-7 w-7 text-red-600" />
                </div>
                <CardTitle className="text-lg">Control de Pagos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Seguimiento completo de pagos a trabajadores temporales con estados y historial por persona.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-xl transition-shadow bg-white/90 border-2 border-red-100">
              <CardHeader>
                <div className="mx-auto w-14 h-14 bg-red-100 rounded-lg flex items-center justify-center mb-4 shadow">
                  <Database className="h-7 w-7 text-red-600" />
                </div>
                <CardTitle className="text-lg">Evidencias Digitales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Almacenamiento organizado de fotografías, listas de asistencia y documentos por actividad.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-xl transition-shadow bg-white/90 border-2 border-red-100">
              <CardHeader>
                <div className="mx-auto w-14 h-14 bg-red-100 rounded-lg flex items-center justify-center mb-4 shadow">
                  <BarChart3 className="h-7 w-7 text-red-600" />
                </div>
                <CardTitle className="text-lg">Reportes Automáticos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Generación automática de informes financieros y operativos with datos consolidados en tiempo real.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 bg-red-50/80">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Beneficios para la Corporación</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Centralización Total</h3>
                    <p className="text-gray-600">
                      Toda la información en un solo lugar, eliminando la dispersión de archivos Excel.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Reducción de Errores</h3>
                    <p className="text-gray-600">
                      Validaciones automáticas que previenen duplicaciones y omisiones en pagos.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Eficiencia Operativa</h3>
                    <p className="text-gray-600">Reducción del 80% en tiempo de generación de reportes e informes.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Transparencia Total</h3>
                    <p className="text-gray-600">
                      Trazabilidad completa de gastos y pagos con evidencias digitales organizadas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-red-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Roles del Sistema</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <Shield className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-semibold">Supervisor</p>
                    <p className="text-sm text-gray-600">Gestión completa de proyectos asignados</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <Shield className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-semibold">Administradora</p>
                    <p className="text-sm text-gray-600">Control de pagos y supervisión general</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-semibold">Presidencia</p>
                    <p className="text-sm text-gray-600">Acceso a reportes e informes ejecutivos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-red-600 via-red-500 to-red-400 shadow-2xl mt-12 border-t-4 border-red-200">
        <div className="container mx-auto text-center flex flex-col items-center gap-6">
          <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-sm tracking-tight animate-fade-in-up">
            Moderniza la Gestión de tus Proyectos Culturales
          </h2>
          <p className="text-red-100 mb-6 max-w-2xl mx-auto text-lg animate-fade-in-up delay-100">
            Únete a la transformación digital de la gestión cultural. Sistema diseñado específicamente para las
            necesidades de organizaciones culturales y sociales.
          </p>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="text-lg px-10 py-4 bg-white text-red-700 border-2 border-white shadow-xl hover:bg-red-50 hover:text-red-800 transition-all duration-200 hover:scale-105 focus:scale-95 focus:ring-2 focus:ring-white animate-fade-in-up delay-200">
              Comenzar Ahora
            </Button>
          </Link>
          <div className="w-24 h-1 bg-gradient-to-r from-red-200 via-white to-red-200 rounded-full mt-6 opacity-70 animate-fade-in-up delay-300" />
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
