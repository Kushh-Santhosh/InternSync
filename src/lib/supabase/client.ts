import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://kkgnhoflqusupqnhgzkz.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZ25ob2ZscXVzdXBxbmhnemt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNjc2NDEsImV4cCI6MjEwNzY0MzY0MX0.OmC1bbSOB12ouCWC8Oei86G4l2vE25Zi6YPY1tfgsO4'

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
