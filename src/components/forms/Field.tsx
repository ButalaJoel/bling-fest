import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const base = 'w-full border-2 border-ink bg-white px-3.5 py-3 text-[16px] text-ink placeholder:text-ink-soft/60 focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple/30 aria-[invalid=true]:border-bad'

type Wrap = { label: string; name: string; error?: string; hint?: ReactNode; required?: boolean; children: ReactNode }

export function Field({ label, name, error, hint, required, children }: Wrap) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-bold">
        {label}{required && <span className="text-orange"> *</span>}
      </label>
      {children}
      {hint && !error && <p id={`${name}-hint`} className="mt-1 text-xs text-ink-soft">{hint}</p>}
      {error && <p id={`${name}-error`} className="mt-1 text-xs font-semibold text-bad">{error}</p>}
    </div>
  )
}

type Common = { label: string; name: string; error?: string; hint?: ReactNode }

export function TextInput({ label, name, error, hint, required, ...rest }: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} name={name} error={error} hint={hint} required={required}>
      <input id={name} name={name} required={required} aria-invalid={!!error} aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined} className={base} {...rest} />
    </Field>
  )
}

export function TextArea({ label, name, error, hint, required, ...rest }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label} name={name} error={error} hint={hint} required={required}>
      <textarea id={name} name={name} required={required} aria-invalid={!!error} aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined} className={`${base} min-h-28`} {...rest} />
    </Field>
  )
}

export function Select({ label, name, error, hint, required, options, placeholder, ...rest }:
  Common & SelectHTMLAttributes<HTMLSelectElement> & { options: readonly { value: string; label: string }[] | readonly string[]; placeholder?: string }) {
  return (
    <Field label={label} name={name} error={error} hint={hint} required={required}>
      <select id={name} name={name} required={required} aria-invalid={!!error} className={`${base} appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10`}
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23191622' stroke-width='3'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  )
}
