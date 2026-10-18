import { useServerFn } from '@tanstack/react-start'
import { CheckCircle2, ChevronLeft, Clipboard, FileJson2, LoaderCircle, RefreshCw, ShieldAlert, XCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { normalizeReconError } from '../../lib/genlayer/errors'
import { submitEvidenceWrite } from '../../lib/genlayer/writes'
import type { ReconAgreementDetail } from '../../lib/genlayer/types'
import { TransactionRunner } from '../../lib/genlayer/transaction'
import { useWallet } from '../../lib/genlayer/wallet'
import { EvidenceVerificationError, isCurrentEvidenceVerification, isEvidenceVerificationForAgreement, validateNetlifyEvidenceUrl, type EvidenceVerificationResult } from '../../lib/evidence/verification'
import { verifyNetlifyEvidence } from '../../lib/evidence/verify.functions'
import { cn, shortAddress } from '../../lib/utils'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog'
import { Field } from '../ui/field'
import { Input } from '../ui/input'

type VerificationState =
  | { phase: 'waiting' }
  | { phase: 'fetching' }
  | { phase: 'verified'; result: EvidenceVerificationResult; warning?: string }
  | { phase: 'failed'; message: string }

function errorMessage(reason: unknown) {
  if (reason instanceof EvidenceVerificationError || reason instanceof Error) return reason.message
  return 'Evidence verification failed. Retry the verification.'
}

function VerificationStatus({ state, onRetry, onCopy }: {
  state: VerificationState
  onRetry: () => void
  onCopy: () => Promise<void>
}) {
  if (state.phase === 'waiting') return (
    <div className="rounded-xl border border-white/[.07] bg-black/20 p-4">
      <div className="flex items-center gap-3">
        <ShieldAlert className="size-4 text-white/35" />
        <div>
          <p className="text-xs font-semibold text-white/70">Waiting for URL</p>
          <p className="mt-1 text-[11px] leading-5 text-white/40">Paste the deployed JSON URL to begin read-only verification.</p>
        </div>
      </div>
    </div>
  )
  if (state.phase === 'fetching') return (
    <div className="rounded-xl border border-[var(--accent)]/15 bg-[var(--accent)]/[.04] p-4">
      <div className="flex items-center gap-3">
        <LoaderCircle className="size-4 animate-spin text-[var(--accent)]" />
        <div>
          <p className="text-xs font-semibold text-white/80">Fetching evidence</p>
          <p className="mt-1 text-[11px] leading-5 text-white/45">Reading raw bytes, validating JSON, and calculating SHA-256…</p>
        </div>
      </div>
    </div>
  )
  if (state.phase === 'failed') return (
    <div className="rounded-xl border border-red-300/15 bg-red-300/[.04] p-4">
      <div className="flex items-start gap-3">
        <XCircle className="mt-0.5 size-4 shrink-0 text-red-200" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-red-100/90">Verification failed</p>
          <p className="mt-1 text-[11px] leading-5 text-red-100/60">{state.message}</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
            <RefreshCw className="size-3.5" /> Retry verification
          </Button>
        </div>
      </div>
    </div>
  )
  return (
    <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[.035] p-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-200" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-emerald-100/90">Evidence verified</p>
          {state.warning ? <p className="mt-1 text-[11px] leading-5 text-amber-100/70">{state.warning}</p> : null}
          <dl className="mt-4 grid gap-3 text-[11px] sm:grid-cols-2">
            <div><dt className="text-white/30">Filename</dt><dd className="mt-1 truncate text-white/75">{state.result.filename}</dd></div>
            <div><dt className="text-white/30">File size</dt><dd className="mt-1 text-white/75">{state.result.byteLength.toLocaleString()} bytes</dd></div>
            <div><dt className="text-white/30">Matched agreement</dt><dd className="mt-1 text-white/75">AGR-{state.result.agreementId}</dd></div>
            <div><dt className="text-white/30">Submitted responses</dt><dd className="mt-1 text-white/75">{state.result.responseCount}</dd></div>
          </dl>
          <div className="mt-4 border-t border-white/[.07] pt-3">
            <p className="text-[10px] uppercase tracking-[.12em] text-white/30">Calculated SHA-256</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 break-all font-mono text-[10px] leading-5 text-white/65">{state.result.sha256}</code>
              <Button variant="secondary" size="icon" className="size-8 shrink-0" onClick={() => void onCopy()} aria-label="Copy SHA-256"><Clipboard className="size-3.5" /></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function EvidenceSubmitDialog({ agreement, onRefresh }: { agreement: ReconAgreementDetail; onRefresh: () => Promise<void> }) {
  const wallet = useWallet()
  const verifyFn = useServerFn(verifyNetlifyEvidence)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'input' | 'review'>('input')
  const [url, setUrl] = useState('')
  const [verification, setVerification] = useState<VerificationState>({ phase: 'waiting' })
  const [write, setWrite] = useState<ReturnType<typeof submitEvidenceWrite>>()
  const requestSerial = useRef(0)
  const requestIds = useMemo(() => agreement.requests.map((request) => request.requestId), [agreement.requests])
  const agreementKey = `${agreement.id}:${requestIds.join('|')}`

  const runVerification = useCallback(async (candidateUrl: string, serial: number, snapshotKey: string, snapshotRequestIds: string[]) => {
    setVerification({ phase: 'fetching' })
    try {
      const result = await verifyFn({ data: { url: candidateUrl, agreementId: agreement.id, requestIds: snapshotRequestIds } })
      if (!isCurrentEvidenceVerification(serial, requestSerial.current, snapshotKey, agreementKey)) return
      setVerification({ phase: 'verified', result })
    } catch (reason) {
      if (!isCurrentEvidenceVerification(serial, requestSerial.current, snapshotKey, agreementKey)) return
      setVerification({ phase: 'failed', message: errorMessage(reason) })
    }
  }, [agreement.id, agreementKey, verifyFn])

  useEffect(() => {
    const serial = ++requestSerial.current
    if (!open || !url.trim()) return
    const timer = window.setTimeout(() => {
      setStep('input')
      try {
        validateNetlifyEvidenceUrl(url.trim())
        void runVerification(url.trim(), serial, agreementKey, requestIds)
      } catch (reason) {
        setVerification({ phase: 'failed', message: errorMessage(reason) })
      }
    }, 300)
    return () => window.clearTimeout(timer)
  }, [agreementKey, open, requestIds, runVerification, url])

  const resetDialog = (next: boolean) => {
    setOpen(next)
    setStep('input')
    setVerification({ phase: 'waiting' })
    if (!next) {
      requestSerial.current += 1
      setUrl('')
    }
  }

  const updateUrl = (next: string) => {
    requestSerial.current += 1
    setStep('input')
    setVerification({ phase: 'waiting' })
    setUrl(next)
  }

  const retry = () => {
    const candidateUrl = url.trim()
    const serial = ++requestSerial.current
    try {
      validateNetlifyEvidenceUrl(candidateUrl)
      void runVerification(candidateUrl, serial, agreementKey, requestIds)
    } catch (reason) {
      setVerification({ phase: 'failed', message: errorMessage(reason) })
    }
  }

  const recheckBeforeReview = async () => {
    const candidateUrl = url.trim()
    if (verification.phase !== 'verified' || !isEvidenceVerificationForAgreement(verification.result, { url: candidateUrl, agreementId: agreement.id, requestIds })) return
    const previous = verification.result
    const serial = ++requestSerial.current
    setVerification({ phase: 'fetching' })
    try {
      const latest = await verifyFn({ data: { url: candidateUrl, agreementId: agreement.id, requestIds } })
      if (serial !== requestSerial.current || !isEvidenceVerificationForAgreement(latest, { url: candidateUrl, agreementId: agreement.id, requestIds })) return
      const sameEvidence = latest.sha256 === previous.sha256 && latest.byteLength === previous.byteLength && latest.agreementId === agreement.id && latest.responseCount === previous.responseCount && latest.requestIds.length === previous.requestIds.length && latest.requestIds.every((id) => previous.requestIds.includes(id))
      if (!sameEvidence) {
        setVerification({ phase: 'verified', result: latest, warning: 'The file changed since the first verification. Its new hash is shown; review it again before signing.' })
        return
      }
      setVerification({ phase: 'verified', result: latest })
      setStep('review')
    } catch (reason) {
      if (serial === requestSerial.current) setVerification({ phase: 'failed', message: errorMessage(reason) })
    }
  }

  const copyHash = async () => {
    if (!canReview || verification.phase !== 'verified') return
    try {
      await navigator.clipboard.writeText(verification.result.sha256)
      toast.success('SHA-256 copied')
    } catch {
      toast.error('Could not copy the SHA-256 commitment')
    }
  }

  const example = JSON.stringify({ agreement_id: Number(agreement.id), responses: agreement.requests.map((request) => ({ request_id: request.requestId, response: 'The provider response for this registered request.' })) }, null, 2)
  const canReview = verification.phase === 'verified' && isEvidenceVerificationForAgreement(verification.result, { url: url.trim(), agreementId: agreement.id, requestIds })
  const visibleVerification = verification.phase === 'verified' && !canReview ? { phase: 'waiting' as const } : verification

  return <>
    <Dialog open={open} onOpenChange={resetDialog}>
      <DialogTrigger asChild><Button><FileJson2 className="size-4" /> Submit evidence</Button></DialogTrigger>
      <DialogContent title="Submit evidence" description="Paste one HTTPS Netlify JSON URL. RECON verifies the exact deployed bytes and generates the commitment on the verification server before signing.">
        {step === 'input' ? <div className="mt-7 space-y-5">
          <Field label="Netlify evidence URL" hint="HTTPS · direct *.netlify.app host" error={verification.phase === 'failed' ? verification.message : undefined}><Input value={url} onChange={(event) => updateUrl(event.target.value)} spellCheck={false} placeholder="https://your-site.netlify.app/evidence.json" /></Field>
          <Field label="SHA-256 commitment" hint="Generated from the exact response bytes"><div className="flex items-center gap-2"><Input value={canReview ? verification.result.sha256 : ''} readOnly placeholder="Generated after evidence verification" className={cn('font-mono text-xs', canReview ? 'text-white/75' : 'text-white/25')} /><Button type="button" variant="secondary" size="icon" className="size-10 shrink-0" disabled={!canReview} onClick={() => void copyHash()} aria-label="Copy SHA-256"><Clipboard className="size-4" /></Button></div></Field>
          <VerificationStatus state={visibleVerification} onRetry={retry} onCopy={copyHash} />
          <div className="rounded-xl border border-white/[.07] bg-black/20 p-4"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-white/70">Expected JSON shape</p><span className="text-[9px] font-bold uppercase tracking-[.12em] text-white/25">Contract parser</span></div><pre className="hide-scrollbar mt-3 max-h-52 overflow-auto whitespace-pre text-[10px] leading-5 text-white/38">{example}</pre></div>
          <Button className="w-full" size="lg" disabled={!canReview} onClick={() => void recheckBeforeReview()}>Review submission</Button>
        </div> : <div className="mt-7">
          <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-5"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-white/30">Agreement</p><p className="mt-2 text-sm font-semibold">AGR-{agreement.id} · {agreement.title}</p><dl className="mt-5 space-y-4 text-xs"><div><dt className="text-white/30">URL</dt><dd className="mt-1 break-all text-white/70">{url}</dd></div><div><dt className="text-white/30">Generated commitment</dt><dd className="mt-1 break-all font-mono text-[10px] text-white/55">{verification.phase === 'verified' ? verification.result.sha256 : ''}</dd></div><div className="flex justify-between"><dt className="text-white/30">Submitting provider</dt><dd className="text-white/70">{shortAddress(agreement.provider)}</dd></div></dl></div>
          <div className="mt-5 rounded-xl border border-amber-300/10 bg-amber-300/[.04] p-4 text-[11px] leading-5 text-amber-100/55">The contract remains the final authority. It will retrieve the URL again, hash the raw bytes, parse the evidence, and let GenLayer validators evaluate responses against the onchain requirements.</div>
          <div className="mt-6 flex justify-between"><Button variant="ghost" onClick={() => setStep('input')}><ChevronLeft className="size-4" /> Edit</Button><Button disabled={!canReview} onClick={() => { if (!canReview || verification.phase !== 'verified') return; setOpen(false); setWrite(submitEvidenceWrite(agreement.id, verification.result.url, verification.result.sha256)) }}>Open Transaction Kit</Button></div>
        </div>}
      </DialogContent>
    </Dialog>
    {write && wallet.kit && wallet.connectedClient ? <TransactionRunner kit={wallet.kit} client={wallet.connectedClient} write={write} label="Submit evidence" intro={<div className="space-y-2 text-sm"><p className="font-semibold">Review evidence submission</p><p className="text-white/45">AGR-{agreement.id} · provider {shortAddress(agreement.provider)}</p></div>} onDismiss={() => setWrite(undefined)} onError={(reason) => toast.error(normalizeReconError(reason))} onSuccess={async () => { setWrite(undefined); await onRefresh(); toast.success('Evidence transaction accepted', { description: 'RECON state will show the evaluated mask when the accepted read updates.' }) }} onFinalized={async () => { await onRefresh() }} /> : null}
  </>
}
