'use client'

import { updateTodoStatus, deleteTodo, updateTodoTitle } from '@/app/actions'
import { useState } from 'react'

export default function TodoItem({ todo }: { todo: any }) {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="flex items-center justify-between bg-gray-800 p-4 rounded mb-2">
      <div className="flex items-center gap-3 w-full">
        {/* Checkbox: Complete */}
        <input
          type="checkbox"
          checked={todo.is_complete}
          onChange={() => updateTodoStatus(todo.id, !todo.is_complete)}
          className="w-5 h-5 accent-blue-500 cursor-pointer"
        />

        {/* Text or Edit Input */}
        {isEditing ? (
          <form 
            action={async (formData) => {
              await updateTodoTitle(formData)
              setIsEditing(false)
            }}
            className="flex-1"
          >
             <input type="hidden" name="id" value={todo.id} />
             <input 
              name="title" 
              defaultValue={todo.title} 
              className="w-full bg-gray-700 text-white p-1 rounded" 
              autoFocus
             />
          </form>
        ) : (
          <span className={`flex-1 ${todo.is_complete ? 'line-through text-gray-500' : 'text-white'}`}>
            {todo.title}
          </span>
        )}
      </div>

      <div className="flex gap-2 ml-4">
        {/* Edit button */}
        <button 
          onClick={() => setIsEditing(!isEditing)} 
          className="text-sm text-yellow-400 hover:text-yellow-300"
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
        
        {/* Delete button */}
        <button 
          onClick={() => deleteTodo(todo.id)}
          className="text-sm text-red-400 hover:text-red-300"
        >
          Delete
        </button>
      </div>
    </div>
  )
}