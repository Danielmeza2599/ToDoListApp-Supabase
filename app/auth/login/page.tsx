import { login, signup } from '../login/actions'

function ErrorMessage({ error, message }: { error: string | null; message: string | null }) {
  if (!error || !message) return null
  
  const decodedMessage = decodeURIComponent(message)
  const isSignupDisabled = decodedMessage.toLowerCase().includes('signup') && 
                           decodedMessage.toLowerCase().includes('disabled')
  
  return (
    <div className="bg-red-900/50 border border-red-700 text-red-200 p-3 rounded text-sm space-y-2">
      <div>
        <strong>Error:</strong> {decodedMessage}
      </div>
      {isSignupDisabled && (
        <div className="mt-2 pt-2 border-t border-red-700">
          <strong className="text-yellow-300">💡 Solution:</strong>
          <ol className="list-decimal list-inside mt-1 space-y-1 text-xs">
            <li>Go to Supabase Dashboard</li>
            <li>Authentication → Providers</li>
            <li>Click on "Email"</li>
            <li>Activate "Enable Email Signup"</li>
            <li>Save changes</li>
          </ol>
        </div>
      )}
    </div>
  )
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }> | { error?: string; message?: string }
}) {
  // Handle both async and sync versions of searchParams (Next.js 15 vs 14)
  const params = searchParams instanceof Promise 
    ? { error: undefined, message: undefined } // In Next.js 15, we would need to use await
    : searchParams

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <form className="flex flex-col gap-4 p-8 border border-gray-700 rounded-lg w-80">
        <h1 className="text-2xl font-bold mb-4">Welcome</h1>
        
        <ErrorMessage error={params?.error || null} message={params?.message || null} />
        
        <label htmlFor="email">Email:</label>
        <input 
          id="email" 
          name="email" 
          type="email" 
          required 
          className="bg-gray-800 p-2 rounded border border-gray-600 text-white" 
        />
        
        <label htmlFor="password">Password:</label>
        <input 
          id="password" 
          name="password" 
          type="password" 
          required 
          minLength={6}
          className="bg-gray-800 p-2 rounded border border-gray-600 text-white" 
        />
        
        <button formAction={login} className="bg-blue-600 p-2 rounded hover:bg-blue-700 transition">
          Log in
        </button>
        <button formAction={signup} className="bg-green-600 p-2 rounded hover:bg-green-700 transition">
          Sign up
        </button>
      </form>
    </div>
  )
}