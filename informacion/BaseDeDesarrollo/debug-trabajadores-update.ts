// Script de debugging para identificar problemas con actualización de trabajadores
// Usar este código en el componente para obtener más información sobre el error

export const debugTrabajadorUpdate = async (trabajadorId: string, activar: boolean, supabase: any, user: any) => {
  console.log('🔍 DEBUG: Intentando actualizar trabajador')
  console.log('📋 Datos:', { trabajadorId, activar, userAuthId: user?.auth_user_id })
  
  try {
    // 1. Verificar la sesión actual
    const { data: session } = await supabase.auth.getSession()
    console.log('👤 Sesión actual:', session?.session?.user?.id)
    
    // 2. Verificar el usuario en la tabla usuarios
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_user_id', session?.session?.user?.id)
      .single()
      
    console.log('👨‍💼 Usuario encontrado:', usuario)
    if (userError) console.error('❌ Error obteniendo usuario:', userError)
    
    // 3. Verificar el trabajador actual
    const { data: trabajadorActual, error: trabajadorError } = await supabase
      .from('trabajadores')
      .select('*')
      .eq('id', trabajadorId)
      .single()
      
    console.log('👷 Trabajador actual:', trabajadorActual)
    if (trabajadorError) console.error('❌ Error obteniendo trabajador:', trabajadorError)
    
    // 4. Intentar la actualización con más detalles
    console.log('🔄 Ejecutando actualización...')
    const { data, error } = await supabase
      .from("trabajadores")
      .update({ activo: activar })
      .eq("id", trabajadorId)
      .select() // Agregar select para ver qué se devuelve
      
    if (error) {
      console.error('❌ Error completo:', error)
      console.error('❌ Error code:', error.code)
      console.error('❌ Error message:', error.message)
      console.error('❌ Error details:', error.details)
      console.error('❌ Error hint:', error.hint)
      throw error
    }
    
    console.log('✅ Actualización exitosa:', data)
    return { success: true, data }
    
  } catch (err: any) {
    console.error('💥 Error completo capturado:', err)
    return { success: false, error: err }
  }
}

// Función mejorada para usar en lugar de confirmarDesactivacion
export const confirmarDesactivacionMejorada = async (
  trabajadorId: string, 
  activar: boolean, 
  supabase: any, 
  user: any,
  onSuccess: () => void,
  onError: (message: string) => void
) => {
  const result = await debugTrabajadorUpdate(trabajadorId, activar, supabase, user)
  
  if (result.success) {
    console.log('✅ Trabajador actualizado exitosamente')
    onSuccess()
  } else {
    console.error('❌ Error actualizando trabajador:', result.error)
    onError(result.error?.message || "Error al actualizar el trabajador")
  }
}
