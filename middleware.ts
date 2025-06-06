import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  try {
    const isAuthPage = req.nextUrl.pathname === "/login"
    const isDashboardPage = req.nextUrl.pathname.startsWith("/dashboard")
    
    // Para páginas del dashboard, verificar si hay tokens de autenticación
    if (isDashboardPage) {
      // Como usamos localStorage en el cliente, el middleware no puede verificar la sesión
      // El middleware principalmente redirige desde login si ya está autenticado
      // La verificación real se hace en el cliente con el AuthContext
      return res
    }
    
    // Para la página de login, permitir acceso normal
    if (isAuthPage) {
      return res
    }
    
    return res
  } catch (error) {
    console.error('Error en middleware:', error)
    return res
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
}
