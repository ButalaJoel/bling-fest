import type { ReactNode } from 'react'

export default function SectionHeading({ kicker, title, intro, align = 'left', dark = false, action }:
  { kicker?: string; title: ReactNode; intro?: ReactNode; align?: 'left' | 'center'; dark?: boolean; action?: ReactNode }) {
  return (
    <div className={`mb-8 flex flex-col gap-4 sm:mb-10 ${align === 'center' ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between'}`}>
      <div className={align === 'center' ? 'max-w-2xl' : 'max-w-3xl'}>
        {kicker && <p className={`wide mb-3 text-xs ${dark ? 'text-orange' : 'text-purple'}`}>{kicker}</p>}
        <h2 className={`display text-5xl sm:text-6xl lg:text-7xl ${dark ? 'text-cream' : 'text-ink'}`}>{title}</h2>
        {intro && <p className={`mt-4 max-w-xl text-base sm:text-lg ${dark ? 'text-cream/75' : 'text-ink-soft'}`}>{intro}</p>}
      </div>
      {action}
    </div>
  )
}
