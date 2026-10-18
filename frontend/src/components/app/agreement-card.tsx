import { Link } from '@tanstack/react-router'
import { ArrowUpRight, CalendarDays, ListChecks } from 'lucide-react'
import type { ReconAgreement } from '../../lib/genlayer/types'
import { formatDate, shortAddress } from '../../lib/utils'
import { Card } from '../ui/card'
import { GenAmount } from './gen-amount'
import { StatusBadge } from './status-badge'

export function AgreementCard({ agreement }: { agreement: ReconAgreement }) {
  return <Link to="/agreements/$id" params={{ id: agreement.id }} className="group block rounded-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
    <Card className="h-full p-5 transition duration-300 group-hover:-translate-y-0.5 group-hover:border-white/[.14] group-hover:bg-[#16171c]">
      <div className="flex items-start justify-between gap-3"><span className="text-[11px] font-semibold tracking-[.12em] text-white/35">AGR-{agreement.id}</span><StatusBadge status={agreement.status} /></div>
      <h3 className="mt-7 text-lg font-semibold leading-snug tracking-[-.035em] text-white">{agreement.title}</h3>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/42">{agreement.description}</p>
      <div className="mt-6 grid grid-cols-2 gap-3 border-y border-white/[.065] py-4 text-xs"><div><p className="text-white/30">Provider</p><p className="mt-1 text-white/70">{shortAddress(agreement.provider)}</p></div><div><p className="text-white/30">Escrow</p><div className="mt-1"><GenAmount amount={agreement.escrowWei} size="sm" /></div></div></div>
      <div className="mt-4 flex items-center justify-between text-[11px] text-white/38"><span className="inline-flex items-center gap-1.5"><ListChecks className="size-3.5" />{agreement.requestCount} request{agreement.requestCount === 1 ? '' : 's'}</span><span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" />{formatDate(agreement.deadline * 1000)}</span><ArrowUpRight className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" /></div>
    </Card>
  </Link>
}
