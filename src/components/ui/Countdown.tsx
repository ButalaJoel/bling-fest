import { useEffect, useState } from 'react'

// Adapted from vana-power-mart SaleCountdown: one tick per second, cleaned up on unmount.
export default function Countdown({ target, dark = false }: { target: string; dark?: boolean }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])

  const left = Math.max(0, Date.parse(target) - now)
  if (left === 0) return <p className="display text-4xl text-orange">It's happening now</p>

  const parts = [
    { v: Math.floor(left / 86_400_000), l: 'Days' },
    { v: Math.floor((left % 86_400_000) / 3_600_000), l: 'Hours' },
    { v: Math.floor((left % 3_600_000) / 60_000), l: 'Mins' },
    { v: Math.floor((left % 60_000) / 1000), l: 'Secs' },
  ]
  return (
    <div className="flex gap-2 sm:gap-3" role="timer" aria-label={`${parts[0].v} days ${parts[1].v} hours until Bling Fest`}>
      {parts.map((p, i) => (
        <div key={p.l} className={`hard-sm min-w-[64px] px-2.5 py-2 text-center sm:min-w-[78px] ${i === 0 ? 'bg-orange text-cream' : dark ? 'bg-cream text-ink' : 'bg-ink text-cream'}`}>
          <div className="display text-3xl tabular-nums sm:text-4xl" aria-hidden="true">{String(p.v).padStart(2, '0')}</div>
          <div className="wide mt-1 text-[9px] opacity-80 sm:text-[10px]" aria-hidden="true">{p.l}</div>
        </div>
      ))}
    </div>
  )
}
