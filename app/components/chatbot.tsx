'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client' 

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: 'Hi 👋, what task do you want to add today?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // API route for the chatbot (avoid CORS problems)
  const CHATBOT_API_URL = '/api/chatbot' 


  // Check authentication status on component mount and listen for changes
  useEffect(() => {
    const supabase = createClient()
    
    // Check initial auth state - try session first (faster), then user
    const checkAuth = async () => {
      try {
        // First try to get session (faster, uses cookies directly)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (session?.user) {
          console.log('✅ User authenticated via session:', session.user.id)
          setUser(session.user)
          setCheckingAuth(false)
          return
        }

        // If no session, try getUser (validates JWT with server)
        if (sessionError) {
          console.warn('⚠️ Session error, trying getUser:', sessionError.message)
        }

        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          console.error('❌ Error checking auth:', userError)
          setUser(null)
        } else if (currentUser) {
          console.log('✅ User authenticated via getUser:', currentUser.id)
          setUser(currentUser)
        } else {
          console.warn('⚠️ No user found')
          setUser(null)
        }
      } catch (error) {
        console.error('❌ Unexpected error checking auth:', error)
        setUser(null)
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 Auth state changed:', event, session?.user?.id)
      setUser(session?.user ?? null)
      setCheckingAuth(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message to the UI
    const userMsg = input
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }])
    setInput('')
    setLoading(true)

    try {
      // Get the current user ID to send to n8n
      const supabase = createClient()
      
      // Try session first (faster)
      let currentUser = user // Use cached user first
      
      if (!currentUser) {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (session?.user) {
          currentUser = session.user
        } else {
          // Fallback to getUser if session doesn't work
          const { data: { user: fetchedUser }, error: authError } = await supabase.auth.getUser()
          
          console.log('🔐 Auth check in sendMessage:', { 
            hasUser: !!fetchedUser, 
            userId: fetchedUser?.id,
            sessionError: sessionError?.message,
            authError: authError?.message 
          })
          
          if (authError) {
            console.error('❌ Auth error:', authError)
            setMessages((prev) => [...prev, { 
              role: 'bot', 
              text: `Authentication error: ${authError.message}. Please reload the page.` 
            }])
            setLoading(false)
            return
          }
          
          currentUser = fetchedUser
        }
      }
      
      if (!currentUser) {
        console.error('❌ No user found')
        setMessages((prev) => [...prev, { 
          role: 'bot', 
          text: 'You must log in first. Please reload the page and log in again.' 
        }])
        setLoading(false)
        return
      }
      
      console.log('✅ Using user:', currentUser.id)

      // Send to our API route (which will proxy to n8n)
      console.log('📤 Sending message to API:', { message: userMsg, userId: currentUser.id })
      
      const response = await fetch(CHATBOT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            message: userMsg
            // The user_id is obtained from the server (more secure)
        }),
      })

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (e) {
          errorData = { message: `Error ${response.status}: ${response.statusText}` }
        }
        
        console.error('❌ Error response from API:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        })
        
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('📥 Response from API:', data)

      // Show bot response
      if (data.success) {
        setMessages((prev) => [...prev, { 
          role: 'bot', 
          text: data.text || 'Understood. Your task has been added.' 
        }])
      } else {
        throw new Error(data.message || data.error || 'Error processing the message')
      }
      
      // Optional: Reload the page to see the new task (or use a context to update state)
      // window.location.reload() 

    } catch (error) {
      console.error('❌ Error sending message:', error)
      setMessages((prev) => [...prev, { 
        role: 'bot', 
        text: error instanceof Error 
          ? `Error: ${error.message}` 
          : 'Error connecting with the assistant. Please try again.' 
      }])
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while checking auth
  if (checkingAuth && isOpen) {
    return (
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
        <div className="bg-gray-800 border border-gray-700 w-80 h-96 rounded-lg shadow-xl mb-4 flex flex-col overflow-hidden">
          <div className="bg-blue-600 p-3 text-white font-bold flex justify-between">
            <span>AI Assistant</span>
            <button onClick={() => setIsOpen(false)} className="text-sm">✕</button>
          </div>
          <div className="flex-1 p-4 flex items-center justify-center bg-gray-900">
            <div className="text-gray-400 text-sm">Checking authentication...</div>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105"
        >
          🤖
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Chat window */}
      {isOpen && (
        <div className="bg-gray-800 border border-gray-700 w-80 h-96 rounded-lg shadow-xl mb-4 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 p-3 text-white font-bold flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span>AI Assistant</span>
              {user ? (
                <span className="text-xs bg-green-500 px-2 py-0.5 rounded" title={`Usuario: ${user.email}`}>
                  ✓
                </span>
              ) : (
                <span className="text-xs bg-red-500 px-2 py-0.5 rounded" title="No autenticado">
                  ✗
                </span>
              )}
            </div>
            <button onClick={() => setIsOpen(false)} className="text-sm">✕</button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-900">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-2 rounded-lg max-w-[80%] text-sm ${
                  msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-gray-400 text-xs animate-pulse">Writing...</div>}
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 bg-gray-800 border-t border-gray-700 flex gap-2">
            <input
              className="flex-1 bg-gray-700 text-white text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Write a task..."
            />
            <button type="submit" disabled={loading} className="text-blue-400 hover:text-blue-300 font-bold">→</button>
          </form>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105"
      >
        🤖
      </button>
    </div>
  )
}