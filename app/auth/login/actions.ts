'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

// Helper to check if it's a Next.js redirect error
function isRedirectError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  if (error.message === 'NEXT_REDIRECT') return true
  // Next.js redirect errors tienen una propiedad digest
  if ('digest' in error) {
    const digest = (error as { digest?: string }).digest
    return typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')
  }
  return false
}

export async function login(formData: FormData) {
  try {
    // Verificar variables de entorno
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ Supabase environment variables not configured')
      redirect('/auth/login?error=config_error&message=Supabase environment variables not configured')
    }

    const supabase = await createClient()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      redirect('/auth/login?error=validation_error&message=Email and password are required')
    }

    // Normalizar y validar email
    const normalizedEmail = email.trim().toLowerCase()
    
    // Validación más estricta de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      redirect('/auth/login?error=validation_error&message=Invalid email')
    }

    console.log('🔐 Intentando login con email:', normalizedEmail)

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (error) {
      console.error('❌ Login error:', error.message, error.status)
      const errorMessage = encodeURIComponent(error.message)
      redirect(`/auth/login?error=login_failed&message=${errorMessage}`)
    }

    if (!authData?.user) {
      redirect('/auth/login?error=login_failed&message=User authentication failed')
    }

    revalidatePath('/', 'layout')
    redirect('/')
  } catch (err) {
    // No capture Next.js redirect errors
    if (isRedirectError(err)) {
      throw err
    }
    console.error('❌ Unexpected error in login:', err)
    const errorMessage = err instanceof Error ? encodeURIComponent(err.message) : 'Unknown error'
    redirect(`/auth/login?error=unexpected_error&message=${errorMessage}`)
  }
}

export async function signup(formData: FormData) {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ Supabase environment variables not configured')
      redirect('/auth/login?error=config_error&message=Supabase environment variables not configured')
    }

    const supabase = await createClient()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      redirect('/auth/login?error=validation_error&message=Email and password are required')
    }

    // Normalizar y validar email
    const normalizedEmail = email.trim().toLowerCase()
    
    // Validación más estricta de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      redirect('/auth/login?error=validation_error&message=Email inválido')
    }

    if (password.length < 6) {
      redirect('/auth/login?error=validation_error&message=La contraseña debe tener al menos 6 caracteres')
    }

    console.log('📝 Intentando signup con email:', normalizedEmail)
    console.log('🔧 URL de Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...')

    const { data: authData, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    })

    if (error) {
      console.error('❌ Error en signup:', error.message, error.status)
      console.error('   Código de error:', error.status)
      console.error('   Detalles completos:', JSON.stringify(error, null, 2))
      
      // Proporcionar mensajes más útiles según el error
      let userFriendlyMessage = error.message
      
      if (error.message.toLowerCase().includes('signups are disabled') || 
          error.message.toLowerCase().includes('signup disabled')) {
        userFriendlyMessage = 'Los registros están deshabilitados. Ve a Supabase Dashboard > Authentication > Providers > Email y activa "Enable Email Signup"'
      } else if (error.message.toLowerCase().includes('email signups are disabled')) {
        userFriendlyMessage = 'Los registros por email están deshabilitados. Actívalos en Supabase Dashboard > Authentication > Providers'
      }
      
      const errorMessage = encodeURIComponent(userFriendlyMessage)
      redirect(`/auth/login?error=signup_failed&message=${errorMessage}`)
    }

    if (!authData?.user) {
      redirect('/auth/login?error=signup_failed&message=No se pudo crear el usuario')
    }

    revalidatePath('/', 'layout')
    redirect('/')
  } catch (err) {
    // No capturar errores de redirect de Next.js
    if (isRedirectError(err)) {
      throw err
    }
    console.error('❌ Error inesperado en signup:', err)
    const errorMessage = err instanceof Error ? encodeURIComponent(err.message) : 'Error desconocido'
    redirect(`/auth/login?error=unexpected_error&message=${errorMessage}`)
  }
}