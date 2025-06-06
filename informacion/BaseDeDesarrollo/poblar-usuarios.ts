// Script de ejemplo para poblar usuarios en Supabase (Node.js)
// Guarda este archivo como informacion/BaseDeDesarrollo/poblar-usuarios.ts
// Ejecuta este script con Node.js después de configurar tus variables de entorno

import { createClient } from '@supabase/supabase-js'

// Usa tus variables de entorno reales
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function crearUsuarioAuth(email: string, password: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw error
  return data.user?.id
}

async function poblarUsuarios() {
  const usuarios = [
    {
      email: 'supervisor@ccc.com',
      password: '123456',
      nombre: 'Juan Supervisor',
      rol: 'supervisor',
    },
    {
      email: 'admin@ccc.com',
      password: '123456',
      nombre: 'María Administradora',
      rol: 'admin',
    },
    {
      email: 'presidente@ccc.com',
      password: '123456',
      nombre: 'Carlos Presidente',
      rol: 'president',
    },
  ]

  for (const usuario of usuarios) {
    try {
      // 1. Crea el usuario en Supabase Auth
      const auth_user_id = await crearUsuarioAuth(usuario.email, usuario.password)
      if (!auth_user_id) throw new Error('No se obtuvo auth_user_id')

      // 2. Inserta el usuario en la tabla usuarios
      const { error: errorInsert } = await supabase.from('usuarios').insert({
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        activo: true,
        auth_user_id,
      })
      if (errorInsert) throw errorInsert
      console.log(`✅ Usuario creado: ${usuario.email}`)
    } catch (err) {
      console.error(`❌ Error creando usuario ${usuario.email}:`, err)
    }
  }
}

poblarUsuarios()
