import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Helper function to get or create a guest session
export function getGuestSession() {
  if (typeof window === 'undefined') return null
  
  let sessionId = localStorage.getItem('guest_session_id')
  
  if (!sessionId) {
    sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('guest_session_id', sessionId)
  }
  
  return sessionId
}

// Helper function to get guest name
export function getGuestName() {
  if (typeof window === 'undefined') return 'Guest'
  
  let guestName = localStorage.getItem('guest_name')
  
  if (!guestName) {
    guestName = `Guest${Math.floor(Math.random() * 10000)}`
    localStorage.setItem('guest_name', guestName)
  }
  
  return guestName
}