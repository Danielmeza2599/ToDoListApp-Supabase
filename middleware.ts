import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type CookieToSet = { name: string; value: string; options?: any }

export async function middleware(request: NextRequest) {
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ ERROR: Supabase environment variables not configured in middleware')
    // If we are on the login page, allow access
    if (request.nextUrl.pathname.startsWith('/auth/login')) {
      return NextResponse.next()
    }
    // Otherwise, redirect to login with error
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('error', 'config_error')
    url.searchParams.set('message', 'Supabase environment variables not configured')
    return NextResponse.redirect(url)
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: CookieToSet[]) {
            cookiesToSet.forEach(({ name, value }) => 
              request.cookies.set(name, value)
            )
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    // If there is an authentication error but not critical, continue
    if (error !== null && error.message && !error.message.includes('JWT') && !error.message.includes('session')) {
      console.error('⚠️  Error in middleware to get user:', error.message)
    }

    // If the user is not authenticated and is trying to access the root, redirect to /auth/login
    if (!user && request.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // If the user is authenticated and is on /auth/login, redirect to the root
    if (user && request.nextUrl.pathname === '/auth/login') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  } catch (error) {
    console.error('❌ Unexpected error in middleware:', error)
    // If there is an error and we are trying to access login, allow access
    if (request.nextUrl.pathname.startsWith('/auth/login')) {
      return NextResponse.next()
    }
    // Otherwise, redirect to login
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return response
}


export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
