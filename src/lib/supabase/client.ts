import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export function createClient() {
  return supabase
}

export function getGuestSession() {
  // Mock guest session for development
  return null
}

export function getGuestName() {
  // Mock guest name for development
  return 'Guest_' + Math.random().toString(36).substring(2, 8)
}