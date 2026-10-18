import type { ReactNode } from 'react'

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-white/85">
        {label}
        {hint ? <span className="text-xs font-normal text-white/35">{hint}</span> : null}
      </span>
      {children}
      {error ? <span className="mt-2 block text-xs text-red-300">{error}</span> : null}
    </label>
  )
}
