import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Container from '../components/ui/Container'
import Button from '../components/ui/Button'
import Notice from '../components/ui/Notice'
import { TextInput } from '../components/forms/Field'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { usePageTitle } from '../lib/usePageTitle'

export default function ResetPassword() {
  usePageTitle('New password')
  const { session } = useAuth()
  const nav = useNavigate()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErr('')
    if (pw.length < 10) return setErr('Use at least 10 characters.')
    if (pw !== pw2) return setErr('The passwords do not match.')
    setBusy(true)
    const { error } = await supabase!.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) return setErr(error.message.includes('weak') || error.message.includes('pwned') ? 'That password is too common. Choose another.' : 'Could not update the password. The link may have expired — request a new one.')
    nav('/sign-in', { replace: true })
  }

  return (
    <Container className="py-14 sm:py-20">
      <form onSubmit={onSubmit} className="hard mx-auto max-w-md space-y-5 border-2 border-ink bg-white p-6 sm:p-8">
        <h1 className="display text-5xl">New password</h1>
        {session === undefined ? <p className="text-ink-soft">Checking your link…</p> : !session ? <Notice tone="bad">This reset link is invalid or has expired. Request a new one from the sign-in page.</Notice> : (
          <>
            <TextInput label="New password" name="pw" type="password" autoComplete="new-password" required minLength={10} value={pw} onChange={(e) => setPw(e.target.value)} hint="At least 10 characters." />
            <TextInput label="Confirm password" name="pw2" type="password" autoComplete="new-password" required value={pw2} onChange={(e) => setPw2(e.target.value)} />
            {err && <Notice tone="bad">{err}</Notice>}
            <Button type="submit" variant="purple" className="w-full" disabled={busy}>Save password</Button>
          </>
        )}
      </form>
    </Container>
  )
}
