import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import Container from '../components/ui/Container'
import Button from '../components/ui/Button'
import Notice from '../components/ui/Notice'
import { TextInput } from '../components/forms/Field'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { usePageTitle } from '../lib/usePageTitle'

export default function SignIn() {
  usePageTitle('Sign In')
  const nav = useNavigate()
  const { session, isAdmin } = useAuth()
  const [mode, setMode] = useState<'signin' | 'reset'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null)

  useEffect(() => { if (session && isAdmin) nav('/admin', { replace: true }) }, [session, isAdmin, nav])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setBusy(true); setMsg(null)
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      // Same message for wrong email and wrong password: don't reveal which accounts exist.
      if (error) setMsg({ tone: 'bad', text: error.status === 429 ? 'Too many attempts. Wait a few minutes and try again.' : 'Email or password is incorrect.' })
    } else {
      await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` })
      setMsg({ tone: 'ok', text: 'If that email has an account, a reset link is on its way. The link expires after a short time.' })
    }
    setBusy(false)
  }

  return (
    <Container className="py-14 sm:py-20">
      <form onSubmit={onSubmit} className="hard mx-auto max-w-md space-y-5 border-2 border-ink bg-white p-6 sm:p-8">
        <h1 className="display text-5xl">{mode === 'signin' ? 'Sign in' : 'Reset password'}</h1>
        <p className="text-sm text-ink-soft">For the Bling Fest team. Vendor accounts open after applications are approved — <Link to="/become-a-vendor" className="font-bold text-purple underline">apply here</Link>.</p>
        {!supabase && <Notice>Sign-in is available once the database is connected.</Notice>}
        {session && isAdmin === false && <Notice tone="bad">This account doesn't have admin access.</Notice>}
        <TextInput label="Email" name="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        {mode === 'signin' && <TextInput label="Password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />}
        {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
        <Button type="submit" variant="purple" className="w-full" disabled={busy || !supabase}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}{mode === 'signin' ? 'Sign in' : 'Send reset link'}
        </Button>
        <button type="button" onClick={() => { setMode(mode === 'signin' ? 'reset' : 'signin'); setMsg(null) }} className="block w-full text-center text-sm font-bold underline">
          {mode === 'signin' ? 'Forgot password?' : 'Back to sign in'}
        </button>
      </form>
    </Container>
  )
}
