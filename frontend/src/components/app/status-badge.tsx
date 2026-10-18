import { Circle } from 'lucide-react'
import type { AgreementStatus } from '../../lib/genlayer/types'
import { cn } from '../../lib/utils'

const statusStyle: Record<AgreementStatus, string> = {
  FUNDED: 'border-blue-300/15 bg-blue-300/[.08] text-blue-200',
  EVALUATING: 'border-violet-300/15 bg-violet-300/[.08] text-violet-200',
  EVALUATED: 'border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]',
  EXPIRED: 'border-amber-300/15 bg-amber-300/[.08] text-amber-200',
  CLOSED: 'border-emerald-300/15 bg-emerald-300/[.08] text-emerald-200',
}

export function StatusBadge({ status }: { status: AgreementStatus }) {
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-[.08em]', statusStyle[status])}><Circle className="size-1.5 fill-current" />{status}</span>
}
