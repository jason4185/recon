import { Check, CircleMinus } from 'lucide-react'
import type { ReconAgreement, ReconRequest } from '../../lib/genlayer/types'
import { Card } from '../ui/card'
import { GenAmount } from './gen-amount'

export function RequestCard({ agreement, request, index }: { agreement: ReconAgreement; request: ReconRequest; index: number }) {
  const evaluated = request.outcome !== 'PENDING'
  return <Card className="overflow-hidden"><div className="flex items-start justify-between gap-4 border-b border-white/[.065] px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-white/32">Request {index + 1}</p><h3 className="mt-1.5 text-sm font-semibold text-white">{request.requestId}</h3></div>{evaluated ? <span className={request.accepted ? 'inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-200' : 'inline-flex items-center gap-1.5 text-xs font-semibold text-red-200'}>{request.accepted ? <Check className="size-4" /> : <CircleMinus className="size-4" />}{request.outcome === 'ACCEPTED' ? 'Accepted' : 'Rejected'}</span> : <span className="text-xs text-white/30">Awaiting evaluation</span>}</div><div className="grid gap-5 p-5 md:grid-cols-[1fr_1fr_auto]"><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-white/30">Requested work</p><p className="mt-2 text-sm leading-6 text-white/70">{request.task}</p></div><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-white/30">Acceptance criteria</p><p className="mt-2 text-sm leading-6 text-white/70">{request.acceptanceCriteria}</p></div><div className="md:text-right"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-white/30">Reward</p><div className="mt-2"><GenAmount amount={agreement.rewardPerRequestWei} size="sm" /></div></div></div></Card>
}
