import { Link } from '@tanstack/react-router'
import { cn } from '../lib/utils'

export function BrandMark({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) {
  return (
    <Link to="/" aria-label="RECON home" className={cn('group inline-flex items-center gap-2.5 font-semibold tracking-[-.04em]', inverse ? 'text-[#111216]' : 'text-white')}>
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true">
        <path d="M7 5.5h9.8c5.2 0 8.2 2.5 8.2 6.6 0 3-1.7 5.2-4.6 6.1L26 26.5h-6.2l-4.7-7.4h-2.6v7.4H7v-21Zm5.5 4.6v4.7h4c1.9 0 3-.8 3-2.4 0-1.5-1.1-2.3-3-2.3h-4Z" fill="currentColor" />
      </svg>
      {!compact ? <span className="text-[15px] tracking-[.16em]">RECON</span> : null}
    </Link>
  )
}
