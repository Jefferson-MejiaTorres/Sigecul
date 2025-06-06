import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { GastosUpdateProvider } from "@/components/gastos/gastos-update-context"
import { PagosUpdateProvider } from "@/components/pagos/pagos-update-context"
import { EvidenciasUpdateProvider } from "@/components/evidencias/evidencias-update-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SIGECUL - Sistema de Gestión Cultural",
  description: "Sistema de control de gestión de proyectos ejecutados por la Corporación Cultural Cúcuta",
  generator: 'Jefferson Torres',
  icons: {
    icon: [
      { url: '/images/favicon/favicon.ico', type: 'image/x-icon' },
      { url: '/images/favicon/favicon.svg', type: 'image/svg+xml' }
    ]
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <GastosUpdateProvider>
            <PagosUpdateProvider>
              <EvidenciasUpdateProvider>
                {children}
              </EvidenciasUpdateProvider>
            </PagosUpdateProvider>
          </GastosUpdateProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
