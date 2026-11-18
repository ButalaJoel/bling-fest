import { useState, type FormEvent } from 'react'
import PageTitle from '../../components/admin/PageTitle'
import Button from '../../components/ui/Button'
import Notice from '../../components/ui/Notice'
import { TextInput } from '../../components/forms/Field'
import { changePassword } from '../../lib/admin'
import { useAuth } from '../../lib/auth'

export default function Account() {
  const { admin } = useAuth()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (next !== confirm) return setMsg({ tone: 'bad', text: 'The new passwords do not match.' })
    setBusy(true)
    try {
      await changePassword(current, next)
      setCurrent(''); setNext(''); setConfirm('')
      setMsg({ tone: 'ok', text: 'Password changed. Any other devices signed in to this account have been signed out.' })
    } catch (err) {
      setMsg({ tone: 'bad', text: (err as Error).message })
    }
    setBusy(false)
  }

  return (
    <>
      <PageTitle title="Account" />
      <div className="hard-sm mb-6 max-w-md border-2 border-ink bg-white p-5 text-sm">
        <p className="font-bold">{admin?.name}</p>
        <p className="text-ink-soft">{admin?.email} • <span className="wide text-[10px] text-purple">{admin?.role}</span></p>
      </div>
      <form onSubmit={onSubmit} className="hard-sm max-w-md space-y-4 border-2 border-ink bg-white p-5">
        <h2 className="display text-3xl">Change password</h2>
        <TextInput label="Current password" name="current" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
        <TextInput label="New password" name="next" type="password" autoComplete="new-password" required minLength={10} maxLength={128} value={next} onChange={(e) => setNext(e.target.value)} hint="At least 10 characters." />
        <TextInput label="Confirm new password" name="confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
        <Button type="submit" variant="purple" disabled={busy}>Save password</Button>
      </form>
    </>
  )
}
