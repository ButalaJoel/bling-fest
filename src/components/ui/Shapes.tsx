// Flyer graphic language: starbursts, sparkles, hearts. Decorative only (aria-hidden).

export function Starburst({ className = '', points = 12 }: { className?: string; points?: number }) {
  const pts: string[] = []
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? 50 : 30
    const a = (Math.PI * i) / points - Math.PI / 2
    pts.push(`${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`)
  }
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <polygon points={pts.join(' ')} fill="currentColor" />
    </svg>
  )
}

export function Sparkle({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <path d="M50 0 C55 35 65 45 100 50 C65 55 55 65 50 100 C45 65 35 55 0 50 C35 45 45 35 50 0Z" fill="currentColor" />
    </svg>
  )
}

export function Halftone({ className = '', color, size = 9, radial = false }: { className?: string; color?: string; size?: number; radial?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`halftone pointer-events-none absolute ${radial ? 'halftone--radial' : ''} ${className}`}
      style={{ ['--dot' as string]: color, ['--dot-size' as string]: `${size}px` }}
    />
  )
}
