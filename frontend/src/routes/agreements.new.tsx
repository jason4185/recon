import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, Check, CirclePlus, Info, MinusCircle, ShieldCheck } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AppShell } from '../components/app/app-shell'
import { GenAmount } from '../components/app/gen-amount'
import { PageHeader } from '../components/app/page-header'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Field } from '../components/ui/field'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { getReadClient } from '../lib/genlayer/client'
import { formatGen } from '../lib/genlayer/amounts'
import { getAgreement, getAgreementCount } from '../lib/genlayer/reads'
import { normalizeReconError } from '../lib/genlayer/errors'
import { TransactionRunner } from '../lib/genlayer/transaction'
import { useWallet } from '../lib/genlayer/wallet'
import { createAgreementWrite, isValidProviderAddress, MAX_REQUESTS, parseGenAmount } from '../lib/genlayer/writes'
import { cn, formatDate, shortAddress } from '../lib/utils'

export const Route = createFileRoute('/agreements/new')({ component: CreateAgreementPage })

type DraftRequest = { requestId: string; task: string; acceptanceCriteria: string }
type Draft = { title: string; description: string; provider: string; reward: string; deadline: string; requests: DraftRequest[] }
type FieldErrors = Record<string, string>

const makeRequest = (index: number): DraftRequest => ({ requestId: `request_${index + 1}`, task: '', acceptanceCriteria: '' })
const initialDraft: Draft = { title: '', description: '', provider: '', reward: '', deadline: '', requests: [makeRequest(0)] }

function validateDraft(draft: Draft): FieldErrors {
  const errors: FieldErrors = {}
  if (!draft.title.trim() || draft.title.length > 160) errors.title = 'Enter a title up to 160 characters.'
  if (!draft.description.trim() || draft.description.length > 4000) errors.description = 'Enter a description up to 4,000 characters.'
  if (!isValidProviderAddress(draft.provider)) errors.provider = 'Enter a valid nonzero provider wallet address.'
  if (!draft.reward.trim()) errors.reward = 'Enter a positive GEN reward.'
  else { try { if (parseGenAmount(draft.reward) <= 0n) errors.reward = 'Reward must be greater than zero.' } catch (reason) { errors.reward = normalizeReconError(reason) } }
  const deadline = draft.deadline ? new Date(draft.deadline).getTime() : 0
  if (!deadline || !Number.isFinite(deadline) || deadline <= Date.now()) errors.deadline = 'Choose a future deadline.'
  if (draft.requests.length < 1 || draft.requests.length > MAX_REQUESTS) errors.requests = 'Register between one and five requests.'
  const ids = new Set<string>()
  draft.requests.forEach((request, index) => {
    if (!/^[a-z0-9][a-z0-9_.-]{0,63}$/.test(request.requestId) || ids.has(request.requestId)) errors[`request-${index}-id`] = 'Use a unique lowercase id: letters, numbers, _, -, or .'
    ids.add(request.requestId)
    if (!request.task.trim() || request.task.length > 2000) errors[`request-${index}-task`] = 'Enter a task up to 2,000 characters.'
    if (!request.acceptanceCriteria.trim() || request.acceptanceCriteria.length > 2000) errors[`request-${index}-criteria`] = 'Enter acceptance criteria up to 2,000 characters.'
  })
  return errors
}

function CreateAgreementPage() {
  const wallet = useWallet()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<Draft>(initialDraft)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [writeOpen, setWriteOpen] = useState(false)
  const [baselineCount, setBaselineCount] = useState<number>()
  const [write, setWrite] = useState<ReturnType<typeof createAgreementWrite>>()
  const escrow = useMemo(() => { try { return BigInt(draft.requests.length) * parseGenAmount(draft.reward || '0') } catch { return 0n } }, [draft.requests.length, draft.reward])
  const updateRequest = (index: number, patch: Partial<DraftRequest>) => setDraft((current) => ({ ...current, requests: current.requests.map((request, requestIndex) => requestIndex === index ? { ...request, ...patch } : request) }))
  const nextRequest = () => setDraft((current) => ({ ...current, requests: [...current.requests, makeRequest(current.requests.length)] }))
  const removeRequest = (index: number) => setDraft((current) => ({ ...current, requests: current.requests.filter((_, requestIndex) => requestIndex !== index) }))
  const validateStep = () => {
    const next = validateDraft(draft)
    setErrors(next)
    if (step === 1) return !next.title && !next.description && !next.provider && !next.reward && !next.deadline
    if (step === 2) return !Object.keys(next).some((key) => key.startsWith('request-') || key === 'requests')
    return Object.keys(next).length === 0
  }
  const beginCreate = async () => {
    const next = validateDraft(draft)
    if (wallet.address && draft.provider.toLowerCase() === wallet.address.toLowerCase()) next.provider = 'The assigned provider must be different from the connected customer wallet.'
    setErrors(next)
    if (Object.keys(next).length) { setStep(Object.keys(next).some((key) => key.startsWith('request-') || key === 'requests') ? 2 : 1); return }
    if (!wallet.address) { await wallet.connect(); return }
    if (wallet.status === 'wrong-network') { await wallet.switchToStudioNext(); return }
    if (wallet.status !== 'connected') { toast.error(wallet.error ?? 'Connect a Studio Next wallet before creating an agreement.'); return }
    try {
      const count = await getAgreementCount(getReadClient())
      const reward = parseGenAmount(draft.reward)
      const deadline = Math.floor(new Date(draft.deadline).getTime() / 1000)
      setBaselineCount(count)
      setWrite(createAgreementWrite({ provider: draft.provider as `0x${string}`, title: draft.title, description: draft.description, requests: draft.requests, rewardPerRequestWei: reward, deadline }))
      setWriteOpen(true)
    } catch (reason) { toast.error(normalizeReconError(reason)) }
  }
  const findCreated = useCallback(async () => {
    if (baselineCount === undefined) return false
    const count = await getAgreementCount(getReadClient())
    if (count <= baselineCount) return false
    const id = String(count)
    await getAgreement(id, getReadClient())
    await queryClient.invalidateQueries({ queryKey: ['recon', 'agreements'] })
    await navigate({ to: '/agreements/$id', params: { id } })
    return true
  }, [baselineCount, navigate, queryClient])
  const onSuccess = useCallback(async (txId: string) => {
    setWriteOpen(false)
    const found = await findCreated()
    if (!found) toast.success('Agreement transaction accepted', { description: `Studio Next transaction ${txId.slice(0, 10)}… is accepted. The new agreement will appear after the count read updates.` })
  }, [findCreated])
  const onFinalized = useCallback(async () => { if (!(await findCreated())) await queryClient.invalidateQueries({ queryKey: ['recon', 'agreements'] }) }, [findCreated, queryClient])
  const relevantErrors = Object.keys(errors).filter((key) => step === 1 ? !key.startsWith('request-') && key !== 'requests' : step === 2 ? key.startsWith('request-') || key === 'requests' : true)

  return <AppShell><div className="mx-auto max-w-[1180px]"><PageHeader eyebrow="Onchain agreement" title="Create an agreement" description="Fund customer-defined requests in one payable Studio Next transaction. The exact escrow is request count multiplied by the reward per accepted request." />
    <div className="mb-8 grid grid-cols-3 gap-2">{['Agreement', 'Requests', 'Review'].map((label, index) => <div key={label} className="flex items-center gap-2"><span className={cn('grid size-6 place-items-center rounded-full border text-[10px] font-bold', step > index + 1 ? 'border-[var(--accent)] bg-[var(--accent)] text-black' : step === index + 1 ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-white/10 text-white/25')}>{step > index + 1 ? <Check className="size-3" /> : index + 1}</span><span className={cn('hidden text-xs sm:inline', step === index + 1 ? 'text-white' : 'text-white/30')}>{label}</span><span className="h-px flex-1 bg-white/[.07] last:hidden" /></div>)}</div>
    {step === 1 ? <div className="grid gap-5 lg:grid-cols-[1fr_300px]"><Card className="space-y-6 p-6 sm:p-7"><Field label="Agreement title" hint={`${draft.title.length}/160`} error={errors.title}><Input value={draft.title} maxLength={160} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="e.g. Spring collection launch strategy" /></Field><Field label="Agreement description" hint={`${draft.description.length}/4,000`} error={errors.description}><Textarea value={draft.description} maxLength={4000} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Describe the service engagement and expected deliverable." /></Field><Field label="Assigned provider wallet" hint="EIP-1193 address" error={errors.provider}><Input value={draft.provider} onChange={(event) => setDraft({ ...draft, provider: event.target.value })} spellCheck={false} placeholder="0x…" /></Field><div className="grid gap-5 sm:grid-cols-2"><Field label="Reward per accepted request" hint="Human GEN amount" error={errors.reward}><Input inputMode="decimal" value={draft.reward} onChange={(event) => setDraft({ ...draft, reward: event.target.value })} placeholder="2" /></Field><Field label="Submission deadline" error={errors.deadline}><Input type="datetime-local" value={draft.deadline} onChange={(event) => setDraft({ ...draft, deadline: event.target.value })} /></Field></div></Card><Card className="h-fit p-5"><p className="text-xs text-white/38">Exact payable escrow</p><div className="mt-4"><GenAmount amount={escrow} size="lg" /></div><p className="mt-3 text-xs text-white/45">{draft.requests.length} request{draft.requests.length === 1 ? '' : 's'} × {draft.reward || '0'} GEN</p><p className="mt-5 border-t border-white/[.065] pt-4 text-[11px] leading-5 text-white/30"><Info className="mr-1 inline size-3" />This amount is sent as the transaction value. No contract call is sent until you review and approve it.</p></Card></div> : null}
    {step === 2 ? <div className="space-y-4"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Registered requests</h2><p className="mt-1 text-xs text-white/35">Each request is stored immutably by the contract.</p></div><Button variant="secondary" size="sm" disabled={draft.requests.length >= MAX_REQUESTS} onClick={nextRequest}><CirclePlus className="size-4" /> Add request</Button></div>{errors.requests ? <p className="text-xs text-red-300">{errors.requests}</p> : null}{draft.requests.map((request, index) => <Card key={`${request.requestId}-${index}`} className="p-6"><div className="mb-6 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[var(--accent)]">Request {index + 1} of {draft.requests.length}</p><p className="mt-1 text-xs text-white/35">Reward: {draft.reward || '0'} GEN if accepted</p></div><Button variant="ghost" size="sm" disabled={draft.requests.length === 1} onClick={() => removeRequest(index)}><MinusCircle className="size-4" /> Remove</Button></div><div className="space-y-5"><Field label="Request ID" hint="Unique, lowercase, 1–64 characters" error={errors[`request-${index}-id`]}><Input value={request.requestId} maxLength={64} onChange={(event) => updateRequest(index, { requestId: event.target.value })} /></Field><Field label="Task description" hint={`${request.task.length}/2,000`} error={errors[`request-${index}-task`]}><Textarea value={request.task} maxLength={2000} onChange={(event) => updateRequest(index, { task: event.target.value })} placeholder="Describe this unit of work." /></Field><Field label="Acceptance criteria" hint={`${request.acceptanceCriteria.length}/2,000`} error={errors[`request-${index}-criteria`]}><Textarea value={request.acceptanceCriteria} maxLength={2000} onChange={(event) => updateRequest(index, { acceptanceCriteria: event.target.value })} placeholder="State the observable requirements for acceptance." /></Field></div></Card>)}</div> : null}
    {step === 3 ? <div className="grid gap-5 lg:grid-cols-[1fr_320px]"><div className="space-y-4"><Card className="p-6"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Agreement</p><h2 className="mt-3 text-2xl font-semibold tracking-[-.04em]">{draft.title}</h2><p className="mt-3 text-sm leading-6 text-white/50">{draft.description}</p></div><ShieldCheck className="size-5 shrink-0 text-[var(--accent)]" /></div><div className="mt-6 grid gap-4 border-t border-white/[.065] pt-5 text-xs sm:grid-cols-2"><div><p className="text-white/30">Provider</p><p className="mt-1 text-white/70">{shortAddress(draft.provider, 9, 7)}</p></div><div><p className="text-white/30">Deadline</p><p className="mt-1 text-white/70">{formatDate(draft.deadline)}</p></div></div></Card>{draft.requests.map((request, index) => <Card key={`${request.requestId}-${index}`} className="p-5"><div className="flex justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-white/30">Request {index + 1} · {request.requestId}</p><p className="mt-3 text-sm leading-6 text-white/75">{request.task}</p><p className="mt-3 text-xs leading-5 text-white/38"><span className="text-white/55">Acceptance:</span> {request.acceptanceCriteria}</p></div><GenAmount amount={escrow / BigInt(draft.requests.length || 1)} size="sm" /></div></Card>)}</div><div><Card className="sticky top-24 p-6"><p className="text-xs font-semibold">Creation summary</p><dl className="mt-5 space-y-3 text-xs"><div className="flex justify-between"><dt className="text-white/35">Requests</dt><dd>{draft.requests.length}</dd></div><div className="flex justify-between"><dt className="text-white/35">Reward each</dt><dd>{draft.reward || '0'} GEN</dd></div><div className="flex justify-between border-t border-white/[.065] pt-3"><dt className="text-white/55">Exact escrow</dt><dd><GenAmount amount={escrow} size="sm" /></dd></div></dl><div className="mt-6 rounded-xl border border-[var(--accent)]/10 bg-[var(--accent)]/[.04] p-4 text-[11px] leading-5 text-white/55">The next step opens Transaction Kit. Review the exact payable value, Studio Next fees, and wallet request before signing.</div><Button className="mt-5 w-full" size="lg" onClick={() => void beginCreate()}>Create Agreement <ArrowRight className="size-4" /></Button></Card></div></div> : null}
    <div className="mt-8 flex items-center justify-between border-t border-white/[.065] pt-6"><Button variant="ghost" disabled={step === 1} onClick={() => setStep((current) => Math.max(1, current - 1))}><ArrowLeft className="size-4" /> Back</Button>{step < 3 ? <Button onClick={() => { if (validateStep()) setStep((current) => current + 1) }}>Continue <ArrowRight className="size-4" /></Button> : null}</div>{relevantErrors.length ? <p className="mt-3 text-right text-[11px] text-red-300/70">Resolve {relevantErrors.length} highlighted field{relevantErrors.length === 1 ? '' : 's'}.</p> : null}
    {writeOpen && write && wallet.kit && wallet.connectedClient ? <TransactionRunner kit={wallet.kit} client={wallet.connectedClient} write={write} label="Create agreement" intro={<div className="space-y-2 text-sm"><p className="font-semibold">Review agreement funding</p><p className="text-white/45">{draft.requests.length} request{draft.requests.length === 1 ? '' : 's'} · {draft.reward} GEN each · {formatGen(escrow)} GEN displayed escrow</p></div>} onDismiss={() => setWriteOpen(false)} onError={(reason) => toast.error(normalizeReconError(reason))} onSuccess={onSuccess} onFinalized={onFinalized} /> : null}
  </div></AppShell>
}
