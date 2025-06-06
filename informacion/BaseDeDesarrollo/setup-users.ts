// Archivo movido desde /app/api/setup-users/route.ts
// Solo para referencia histórica de cómo se poblaron usuarios de prueba en Supabase.
// NO USAR en producción. No afecta el funcionamiento del sistema.
// Puedes consultar este ejemplo para scripts de desarrollo o pruebas.
/*
import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createServerSupabaseClient()

    const testUsers = [
      {
        email: "supervisor@ccc.com",
        password: "123456",
        user_metadata: {
          nombre: "Juan Supervisor",
          rol: "supervisor",
        },
      },
      {
        email: "admin@ccc.com",
        password: "123456",
        user_metadata: {
          nombre: "María Administradora",
          rol: "admin",
        },
      },
      {
        email: "presidente@ccc.com",
        password: "123456",
        user_metadata: {
          nombre: "Carlos Presidente",
          rol: "president",
        },
      },
    ]

    const results = []

    for (const user of testUsers) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        user_metadata: user.user_metadata,
        email_confirm: true,
      })

      if (error) {
        console.error(`Error creating user ${user.email}:`, error)
        results.push({ email: user.email, success: false, error: error.message })
      } else {
        console.log(`User ${user.email} created successfully`)
        results.push({ email: user.email, success: true, id: data.user?.id })
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error in setup-users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
*/
