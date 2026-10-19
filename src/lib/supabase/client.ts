import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://kkgnhoflqusupqnhgzkz.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY =
  'YOUR_SUPABASE_ANON_KEY_PLACEHOLDER'

const envUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL)
const envKey = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY)

const supabaseUrl = envUrl || DEFAULT_SUPABASE_URL
const supabaseAnonKey = envKey || DEFAULT_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('example.com')
)

// Supabase client instance (or null if unconfigured)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
