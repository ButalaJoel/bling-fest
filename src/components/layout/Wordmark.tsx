import { Link } from 'react-router-dom'

export default function Wordmark({ light = false, className = '' }: { light?: boolean; className?: string }) {
  return (
    <Link to="/" aria-label="Bling Fest home" className={`display inline-flex items-baseline gap-1 text-[28px] leading-none sm:text-3xl ${className}`}>
      <span className={light ? 'text-cream' : 'text-purple'}>BLING</span>
      <span className="text-orange">FEST</span>
    </Link>
  )
}
