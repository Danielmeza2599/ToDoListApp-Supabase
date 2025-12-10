'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addTodo(formData: FormData) {
  const supabase = await createClient()
  
  // the current user is obtained to assign the task
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return;

  const title = formData.get('title') as string

  const { error } = await supabase.from('todos').insert({ 
    title, 
    user_id: user.id 
  })

  if (error) {
    console.error('Error adding todo:', error)
    throw error
  }

  revalidatePath('/') // UI is refreshed
}

export async function updateTodoStatus(id: number, is_complete: boolean) {
  const supabase = await createClient()
  await supabase.from('todos').update({ is_complete }).eq('id', id)
  revalidatePath('/')
}

export async function deleteTodo(id: number) {
  const supabase = await createClient()
  await supabase.from('todos').delete().eq('id', id)
  revalidatePath('/')
}

export async function updateTodoTitle(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id')
  const title = formData.get('title')
  
  await supabase.from('todos').update({ title }).eq('id', id)
  revalidatePath('/')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}