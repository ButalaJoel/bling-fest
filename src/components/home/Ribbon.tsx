import { SITE } from '../../config/site'
import { Sparkle } from '../ui/Shapes'

export default function Ribbon({ tone = 'ink' }: { tone?: 'ink' | 'orange' }) {
  const words = [...SITE.tagline, 'Art Exhibition', 'Runway', 'Market']
  const row = [...words, ...words]
  return (
    <div className={`overflow-hidden border-y-2 border-ink py-3 ${tone === 'ink' ? 'bg-ink text-cream' : 'bg-orange text-ink'}`} aria-label={SITE.tagline.join(', ')}>
      <div className="marquee flex w-max items-center gap-6" aria-hidden="true">
        {[...row, ...row].map((w, i) => (
          <span key={i} className="display flex items-center gap-6 text-3xl sm:text-4xl">
            {w}<Sparkle className={`h-5 w-5 ${tone === 'ink' ? 'text-orange' : 'text-purple'}`} />
          </span>
        ))}
      </div>
    </div>
  )
}
