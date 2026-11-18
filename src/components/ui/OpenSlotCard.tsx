import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

/** Honest filler for galleries that aren't full yet: invites the right people to apply. */
export default function OpenSlotCard({ title, text, to }: { title: string; text: string; to: string }) {
  return (
    <Link to={to} className="group flex min-h-64 flex-col items-center justify-center gap-3 border-2 border-dashed border-ink bg-cream-deep/60 p-6 text-center transition hover:bg-purple hover:text-cream">
      <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-current"><Plus className="h-7 w-7" /></span>
      <p className="display text-3xl">{title}</p>
      <p className="max-w-[16rem] text-sm opacity-80">{text}</p>
    </Link>
  )
}
