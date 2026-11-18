import type { ReactNode } from 'react'
import { usePageTitle } from '../../lib/usePageTitle'

export default function PageTitle({ title, children }: { title: string; children?: ReactNode }) {
  usePageTitle(`${title} · Admin`)
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <h1 className="display text-5xl">{title}</h1>
      {children}
    </div>
  )
}
