import type { ShowcaseItem } from '../../data/showcase'

/** Card for artwork, collections and products. Marked "Placeholder" until real vendors are approved. */
export default function ShowcaseCard({ item, wide = false, placeholder = true }: { item: ShowcaseItem; wide?: boolean; placeholder?: boolean }) {
  return (
    <article className="group hard-sm flex flex-col border-2 border-ink bg-white">
      <div className={`relative overflow-hidden border-b-2 border-ink ${wide ? 'aspect-[16/10]' : 'aspect-square'}`}>
        <img src={item.image} alt={item.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <span className="wide absolute left-2 top-2 bg-cream px-2 py-1 text-[9px] text-ink sm:text-[10px]">{item.category}</span>
        {placeholder && <span className="absolute bottom-2 right-2 rounded bg-ink/85 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cream">Placeholder</span>}
      </div>
      <div className="flex-1 p-3 sm:p-4">
        <h3 className="display text-2xl sm:text-3xl">{item.title}</h3>
        <p className="mt-0.5 text-xs font-semibold text-purple sm:text-sm">{item.by}</p>
        <p className="mt-2 hidden text-sm text-ink-soft sm:block">{item.blurb}</p>
      </div>
    </article>
  )
}
