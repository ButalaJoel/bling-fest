import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Variant = 'orange' | 'purple' | 'ink' | 'cream' | 'outline'
const styles: Record<Variant, string> = {
  orange: 'bg-orange text-cream hover:bg-orange-deep',
  purple: 'bg-purple text-cream hover:bg-purple-deep',
  ink: 'bg-ink text-cream hover:bg-black',
  cream: 'bg-cream text-ink hover:bg-white',
  outline: 'bg-transparent text-ink border-2 border-ink hover:bg-ink hover:text-cream',
}

type Props = {
  children: ReactNode
  variant?: Variant
  to?: string
  href?: string
  type?: 'button' | 'submit'
  onClick?: () => void
  disabled?: boolean
  className?: string
  size?: 'md' | 'lg' | 'sm'
}

export default function Button({ children, variant = 'orange', to, href, type = 'button', onClick, disabled, className = '', size = 'md' }: Props) {
  const sz = size === 'lg' ? 'px-6 py-4 text-[13px] sm:text-sm' : size === 'sm' ? 'px-3.5 py-2 text-xs' : 'px-5 py-3 text-sm'
  const cls = `wide inline-flex items-center justify-center gap-2 text-center sm:whitespace-nowrap rounded-full ${sz} transition active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 disabled:pointer-events-none ${variant === 'outline' ? '' : 'hard-sm'} ${styles[variant]} ${className}`
  if (to) return <Link to={to} className={cls}>{children}</Link>
  if (href) return <a href={href} className={cls} target="_blank" rel="noopener noreferrer">{children}</a>
  return <button type={type} onClick={onClick} disabled={disabled} className={cls}>{children}</button>
}
