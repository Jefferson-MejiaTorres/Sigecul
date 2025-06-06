"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const router = useRouter()
  const { signIn, isAuthenticated, loading: authLoading, session } = useAuth()

  // Verificar autenticación solo una vez
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      setRedirecting(true)
      // Agregar un pequeño delay para evitar bucles
      setTimeout(() => {
        window.location.href = "/dashboard" // Usar window.location para forzar navegación
      }, 500)
    }
  }, [isAuthenticated, authLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const { error: signInError } = await signIn(formData.email, formData.password)

      if (signInError) {
        setError(signInError.message || "Error al iniciar sesión")
      } else {
        setRedirecting(true)
        // Usar window.location para forzar la navegación
        setTimeout(() => {
          window.location.href = "/dashboard"
        }, 1000)
      }
    } catch (err: any) {
      setError("Error inesperado al iniciar sesión")
      console.error("Login error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Mostrar loading mientras se verifica la autenticación o se redirige
  if (authLoading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">{redirecting ? "Redirigiendo..." : "Verificando sesión..."}</p>
        </div>
      </div>
    )
  }

  // Si ya está autenticado, no mostrar el formulario
  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Image
              src="/images/logo-ccc.png"
              alt="Corporación Cultural Cúcuta"
              width={60}
              height={60}
              className="rounded-full"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SiGeCul</h1>
              <p className="text-sm text-gray-600">Sistema de Gestión Cultural</p>
            </div>
          </div>
        </div>

        <Card className="shadow-lg border-red-100">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">Iniciar Sesión</CardTitle>
            <CardDescription>Accede al sistema de gestión de proyectos culturales</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@corporacioncultural.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingrese su contraseña"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="#" className="text-sm text-red-600 hover:text-red-700">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Demo credentials */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-700 mb-2">Credenciales de demostración:</p>
              <div className="text-xs text-gray-600 space-y-1">
                <p>
                  <strong>Supervisor:</strong> supervisor@ccc.com / 123456
                </p>
                <p>
                  <strong>Administradora:</strong> admin@ccc.com / 123456
                </p>
                <p>
                  <strong>Presidencia:</strong> presidente@ccc.com / 123456
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
