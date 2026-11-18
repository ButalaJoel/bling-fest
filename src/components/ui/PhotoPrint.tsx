/** Cutout-style photo with a white print border, slight tilt, optional "placeholder" tag. */
export default function PhotoPrint({ src, alt, tilt = 0, className = '', placeholder = false, imgClassName = 'aspect-square' }:
  { src: string; alt: string; tilt?: number; className?: string; placeholder?: boolean; imgClassName?: string }) {
  return (
    <figure className={`print relative ${className}`} style={{ transform: `rotate(${tilt}deg)` }}>
      <img src={src} alt={alt} loading="lazy" className={`block w-full object-cover ${imgClassName}`} />
      {placeholder && (
        <figcaption className="absolute bottom-2 left-2 rounded bg-ink/85 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cream">
          Placeholder
        </figcaption>
      )}
    </figure>
  )
}
