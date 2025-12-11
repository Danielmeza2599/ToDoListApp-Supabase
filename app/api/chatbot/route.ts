import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// N8N webhook URL
const N8N_WEBHOOK_URL = 'https://auh5gcvvzumixyoszacfze94.hooks.n8n.cloud/webhook-test/chat'

export async function POST(request: NextRequest) {
  try {
    // Check user authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authenticated',
          message: 'You must log in to use the chatbot',
        },
        { status: 401 }
      )
    }

    // Get the message from the request body
    const body = await request.json()
    const { message } = body

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid message',
          message: 'The message is required',
        },
        { status: 400 }
      )
    }

    // Make the request to n8n from the server (without CORS problems)
    console.log('📤 Enviando a n8n:', {
      url: N8N_WEBHOOK_URL,
      message: message.trim(),
      userId: user.id,
    })

    // Check if the URL is not a placeholder
    if (N8N_WEBHOOK_URL.includes('tu-n8n-url.com') || N8N_WEBHOOK_URL.includes('example.com')) {
      return NextResponse.json(
        {
          success: false,
          error: 'N8N URL not configured',
          message: 'Please update the N8N_WEBHOOK_URL variable in the route.ts file with the real URL of your n8n webhook.',
        },
        { status: 500 }
      )
    }

    // Create AbortController for timeout (more compatible)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 seconds

    let n8nResponse
    try {
      n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          user_id: user.id,
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.error('❌ Error making fetch to n8n:', fetchError)
      
      // Check if it is a connection error or timeout
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError' || fetchError.message.includes('timeout')) {
          return NextResponse.json(
            {
              success: false,
              error: 'Timeout',
              message: 'The n8n server did not respond in time. Verify that the URL is correct.',
            },
            { status: 504 }
          )
        }
        
        if (fetchError.message.includes('ECONNREFUSED') || fetchError.message.includes('ENOTFOUND')) {
          return NextResponse.json(
            {
              success: false,
              error: 'Connection error',
              message: `Could not connect to n8n. Verify that the URL ${N8N_WEBHOOK_URL} is correct and accessible.`,
            },
            { status: 503 }
          )
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Network error',
          message: `Error connecting to n8n: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
        },
        { status: 503 }
      )
    }

    if (!n8nResponse.ok) {
      let errorText = ''
      try {
        errorText = await n8nResponse.text()
      } catch (e) {
        errorText = 'Could not read the response body'
      }
      
      console.error('❌ Error in n8n response:', {
        status: n8nResponse.status,
        statusText: n8nResponse.statusText,
        body: errorText,
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Error communicating with n8n',
          message: `Error ${n8nResponse.status}: ${n8nResponse.statusText}. ${errorText ? `Details: ${errorText.substring(0, 200)}` : ''}`,
        },
        { status: n8nResponse.status >= 500 ? 502 : n8nResponse.status }
      )
    }

    // Parse the n8n response
    let n8nData
    try {
      n8nData = await n8nResponse.json()
    } catch (parseError) {
      console.error('❌ Error parsing n8n response:', parseError)
      return NextResponse.json(
        {
          success: false,
          error: 'Error processing response',
          message: 'The n8n response is not a valid JSON.',
        },
        { status: 502 }
      )
    }

    // Return the response to the client
    return NextResponse.json({
      success: true,
      text: n8nData.text || n8nData.message || 'Understood. Your task has been added.',
      data: n8nData,
    })
  } catch (error) {
    console.error('❌ Unexpected error in chatbot API route:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A')
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error 
          ? `${error.message}${error.stack ? `\nStack: ${error.stack.substring(0, 200)}` : ''}` 
          : 'Unknown error',
        details: process.env.NODE_ENV === 'development' 
          ? {
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            }
          : undefined,
      },
      { status: 500 }
    )
  }
}
