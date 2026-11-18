import type { ReactNode } from 'react'

export default function Notice({ tone = 'info', children }: { tone?: 'info' | 'ok' | 'bad'; children: ReactNode }) {
  const t = tone === 'ok' ? 'border-ok bg-ok/10 text-ok' : tone === 'bad' ? 'border-bad bg-bad/10 text-bad' : 'border-purple bg-purple/10 text-purple-deep'
  return <div role={tone === 'bad' ? 'alert' : 'status'} className={`border-l-4 px-4 py-3 text-sm ${t}`}>{children}</div>
}
