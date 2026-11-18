import type { ReactNode } from 'react'

type Tone = 'orange' | 'purple' | 'ink' | 'cream' | 'magenta'
const tones: Record<Tone, string> = {
  orange: 'bg-orange text-cream',
  purple: 'bg-purple text-cream',
  ink: 'bg-ink text-cream',
  cream: 'bg-cream text-ink',
  magenta: 'bg-magenta text-cream',
}

/** Slanted label, like the "MAKERERE • KAMPALA / COMING SOON" plate on the flyer. */
export default function Sticker({ children, tone = 'ink', tilt = -3, className = '' }: { children: ReactNode; tone?: Tone; tilt?: number; className?: string }) {
  return (
    <span
      className={`wide inline-block px-3 py-1.5 text-[11px] leading-none sm:text-xs ${tones[tone]} ${className}`}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      {children}
    </span>
  )
}
