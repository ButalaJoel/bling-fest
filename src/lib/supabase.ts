import { createClient } from '@supabase/supabase-js'

// Pattern from nova-works: the client is null until the public URL + anon key are configured.
// Only the anon (public) key is ever used in the browser. Row Level Security protects the data.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase = url && key
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, flowType: 'pkce' } })
  : null

export const isConnected = supabase !== null

/** Narrow helper for code paths that only run after a connection check. */
export function db() {
  if (!supabase) throw new Error('NOT_CONNECTED')
  return supabase
}
