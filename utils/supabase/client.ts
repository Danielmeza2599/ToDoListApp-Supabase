import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // createBrowserClient maneja las cookies automáticamente en el navegador
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}