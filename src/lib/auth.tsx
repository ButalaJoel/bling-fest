import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from './api'

export type Role = 'owner' | 'admin' | 'reviewer'
export type Admin = { id: string; email: string; name: string; role: Role }

type AuthState = {
  admin: Admin | null | undefined // undefined = still checking
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState>({ admin: null, signIn: async () => {}, signOut: async () => {}, refresh: async () => {} })

// The session lives in an httpOnly cookie the page can't read; we ask the server who we are.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null | undefined>(undefined)

  const refresh = useCallback(async () => {
    try {
      const r = await api<{ admin: Admin }>('/auth/me')
      setAdmin(r.admin)
    } catch {
      setAdmin(null)
    }
  }, [])

  useEffect(() => {
    refresh()
    const onOut = () => setAdmin(null)
    window.addEventListener('bf:signed-out', onOut)
    return () => window.removeEventListener('bf:signed-out', onOut)
  }, [refresh])

  const signIn = async (email: string, password: string) => {
    await api('/auth/login', { method: 'POST', body: { email, password } })
    await refresh()
  }
  const signOut = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {})
    setAdmin(null)
  }

  return <AuthContext.Provider value={{ admin, signIn, signOut, refresh }}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
export const canManage = (a: Admin | null | undefined) => a?.role === 'owner' || a?.role === 'admin'
