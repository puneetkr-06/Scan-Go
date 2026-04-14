import { createClient } from '@supabase/supabase-js'

const url = String(import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const anon = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()
const placeholder =
  /your-project\.supabase\.co/i.test(url) ||
  /^your-anon-key$/i.test(anon) ||
  url === '' ||
  anon === ''

export const isSupabaseConfigured = Boolean(url && anon && !placeholder)

export const supabase = isSupabaseConfigured
  ? createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null
