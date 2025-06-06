// crear-usuarios-auth.ts
// Script de referencia para crear usuarios en Supabase Auth desde Node.js
// Ubica este archivo en informacion/BaseDeDatosNueva/crear-usuarios-auth.ts
// Ejecuta con Node.js después de instalar @supabase/supabase-js

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Usa la clave de rol de servicio
)

const usuarios = [
  {
    email: 'supervisor@ccc.com',
    password: '123456',
    user_metadata: { nombre: 'Jefferson Supervisor', rol: 'supervisor' },
    id: '5f66f14a-672a-4eac-b5f2-ccdaf61c873e'
  },
  {
    email: 'admin@ccc.com',
    password: '123456',
    user_metadata: { nombre: 'Luisa Administradora', rol: 'admin' },
    id: '18df0789-9d0d-41b6-9ac8-174c972cd815'
  },
  {
    email: 'presidente@ccc.com',
    password: '123456',
    user_metadata: { nombre: 'Manuel Presidente', rol: 'president' },
    id: 'b3ed4b34-1cea-4b0a-90da-30badd58ffba'
  }
]

async function crearUsuarios() {
  for (const user of usuarios) {
    // El campo id solo funcionará si la API de Supabase lo permite, si no, omítelo
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      user_metadata: user.user_metadata,
      email_confirm: true
      // id: user.id // Descomenta si tu versión de supabase-js lo permite
    })
    if (error) {
      console.error(`Error creando ${user.email}:`, error)
    } else {
      console.log(`Usuario ${user.email} creado:`, data.user?.id)
    }
  }
}

crearUsuarios()
