import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://kkgnhoflqusupqnhgzkz.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY =
  'YOUR_SUPABASE_ANON_KEY_PLACEHOLDER'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

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
