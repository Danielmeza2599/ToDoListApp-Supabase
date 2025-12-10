import { login, signup } from '../login/actions'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <form className="flex flex-col gap-4 p-8 border border-gray-700 rounded-lg w-80">
        <h1 className="text-2xl font-bold mb-4">Bienvenido</h1>
        
        <label htmlFor="email">Email:</label>
        <input id="email" name="email" type="email" required className="bg-gray-800 p-2 rounded border border-gray-600" />
        
        <label htmlFor="password">Password:</label>
        <input id="password" name="password" type="password" required className="bg-gray-800 p-2 rounded border border-gray-600" />
        
        <button formAction={login} className="bg-blue-600 p-2 rounded hover:bg-blue-700">Log in</button>
        <button formAction={signup} className="bg-green-600 p-2 rounded hover:bg-green-700">Sign up</button>
      </form>
    </div>
  )
}