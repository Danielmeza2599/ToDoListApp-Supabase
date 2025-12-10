import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { addTodo, signOut } from './actions'
import TodoItem from './components/todo-item'

export default async function Home() {
  const supabase = await createClient()

  //  Check if the user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  //Get tasks (Ordered by date)
  const { data: todos } = await supabase
    .from('todos')
    .select('*')
    .order('inserted_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">My Tasks 🚀</h1>
            <form action={signOut}>
                <button className="text-xs bg-gray-700 px-3 py-1 rounded">Sign Out</button>
            </form>
        </div>

        {/* Add form */}
        <form action={addTodo} className="mb-6 flex gap-2">
          <input 
            name="title" 
            type="text" 
            placeholder="New task..." 
            required
            className="flex-1 p-3 rounded bg-gray-800 border border-gray-700 text-white"
          />
          <button className="bg-blue-600 px-4 rounded font-bold hover:bg-blue-500">
            +
          </button>
        </form>

        {/* Tasks list */}
        <div className="flex flex-col gap-2">
          {todos?.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
          {todos?.length === 0 && (
            <p className="text-center text-gray-500 mt-4">You have no pending tasks.</p>
          )}
        </div>
      </div>
    </main>
  )
}