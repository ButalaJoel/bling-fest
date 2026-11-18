import { statusLabel } from '../../config/site'

const tone: Record<string, string> = {
  pending: 'bg-cream-deep text-ink',
  under_review: 'bg-purple text-cream',
  approved: 'bg-ok text-white',
  rejected: 'bg-bad text-white',
}

export default function StatusBadge({ status }: { status: string }) {
  return <span className={`wide inline-block whitespace-nowrap rounded px-2 py-1 text-[9px] ${tone[status] ?? 'bg-ink text-cream'}`}>{statusLabel(status)}</span>
}
