import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

type AuthState = {
  session: Session | null | undefined // undefined = still loading
  isAdmin: boolean | null // null = not checked yet
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({ session: null, isAdmin: false, signOut: async () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(supabase ? undefined : null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    let live = true
    if (!supabase || !session) {
      setIsAdmin(session === null ? false : null)
      return
    }
    setIsAdmin(null)
    // The UI check is only for routing. The real lock is Row Level Security in the database.
    supabase.rpc('is_admin').then(({ data, error }) => {
      if (live) setIsAdmin(!error && data === true)
    })
    return () => { live = false }
  }, [session])

  const signOut = async () => {
    await supabase?.auth.signOut()
    setSession(null)
  }

  return <AuthContext.Provider value={{ session, isAdmin, signOut }}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
