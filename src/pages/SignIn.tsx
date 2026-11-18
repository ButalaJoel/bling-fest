import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import Container from '../components/ui/Container'
import Button from '../components/ui/Button'
import Notice from '../components/ui/Notice'
import { TextInput } from '../components/forms/Field'
import { useAuth } from '../lib/auth'
import { usePageTitle } from '../lib/usePageTitle'

export default function SignIn() {
  usePageTitle('Sign In')
  const nav = useNavigate()
  const { admin, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (admin) nav('/admin', { replace: true }) }, [admin, nav])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await signIn(email.trim(), password)
      setPassword('')
    } catch (err) {
      setError((err as Error).message)
    }
    setBusy(false)
  }

  return (
    <Container className="py-14 sm:py-20">
      <form onSubmit={onSubmit} className="hard mx-auto max-w-md space-y-5 border-2 border-ink bg-white p-6 sm:p-8">
        <h1 className="display text-5xl">Sign in</h1>
        <p className="text-sm text-ink-soft">For the Bling Fest team. Vendor accounts open after applications are approved — <Link to="/become-a-vendor" className="font-bold text-purple underline">apply here</Link>.</p>
        <TextInput label="Email" name="email" type="email" autoComplete="username" required maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextInput label="Password" name="password" type="password" autoComplete="current-password" required maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <Notice tone="bad">{error}</Notice>}
        <Button type="submit" variant="purple" className="w-full" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}Sign in
        </Button>
        <p className="text-center text-xs text-ink-soft">Forgot your password? Ask the Bling Fest owner to reset it.</p>
      </form>
    </Container>
  )
}
