import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Clock3, Layers3, Plus, ShieldCheck, WalletCards } from 'lucide-react'
import type { ReactNode } from 'react'
import { AppShell } from '../components/app/app-shell'
import { AgreementCard } from '../components/app/agreement-card'
import { EmptyState } from '../components/app/empty-state'
import { GenAmount } from '../components/app/gen-amount'
import { PageHeader } from '../components/app/page-header'
import { Button, buttonVariants } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { getReadClient } from '../lib/genlayer/client'
import { listAgreements } from '../lib/genlayer/reads'
import { useWallet } from '../lib/genlayer/wallet'
import { cn } from '../lib/utils'

export const Route = createFileRoute('/app')({ component: DashboardPage })

function DashboardPage() {
  const wallet = useWallet()
  const connected = wallet.status === 'connected' && Boolean(wallet.address)
  const query = useQuery({ queryKey: ['recon', 'agreements', wallet.address], queryFn: () => listAgreements({ limit: 50 }, getReadClient()), enabled: connected, staleTime: 15_000 })
  const agreements = query.data?.agreements.filter((agreement) => agreement.customer.toLowerCase() === wallet.address?.toLowerCase() || agreement.provider.toLowerCase() === wallet.address?.toLowerCase()) ?? []
  const active = agreements.filter((agreement) => agreement.status !== 'CLOSED')
  const pending = agreements.filter((agreement) => agreement.status === 'FUNDED')
  const totalEscrow = active.reduce((sum, agreement) => sum + agreement.escrowWei, 0n)
  const claimable = agreements.reduce((sum, agreement) => {
    if (agreement.provider.toLowerCase() === wallet.address?.toLowerCase() && !agreement.providerClaimed) return sum + agreement.providerEntitlementWei
    if (agreement.customer.toLowerCase() === wallet.address?.toLowerCase() && !agreement.customerRefundClaimed) return sum + agreement.customerRefundEntitlementWei
    return sum
  }, 0n)
  const metrics = [{ label: 'GEN escrowed', value: <GenAmount amount={totalEscrow} size="lg" />, icon: WalletCards }, { label: 'Active agreements', value: String(active.length).padStart(2, '0'), icon: Layers3 }, { label: 'Pending evaluations', value: String(pending.length).padStart(2, '0'), icon: Clock3 }, { label: 'Claimable GEN', value: <GenAmount amount={claimable} size="lg" />, icon: ShieldCheck }]

  return <AppShell><div className="mx-auto max-w-[1400px]">
    {!connected ? <ConnectionPrompt title="Connect your wallet to open RECON" description="Dashboard totals and actions are read from the deployed agreement contract for the connected address." action={<Button onClick={() => void wallet.connect()}>Connect wallet</Button>} /> : null}
    {connected && query.isPending ? <LoadingState /> : null}
    {connected && query.isError ? <ErrorState message={query.error instanceof Error ? query.error.message : 'The Studio Next read failed.'} onRetry={() => void query.refetch()} /> : null}
    {connected && !query.isPending && !query.isError ? <>
      <PageHeader eyebrow="Onchain workspace" title={`Good to see you, ${wallet.address ? wallet.address.slice(0, 6) : 'there'}.`} description="Agreements and claimable allocations associated with the connected wallet." action={<Link to="/agreements/new" className={buttonVariants()}><Plus className="size-4" /> New agreement</Link>} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, icon: Icon }) => <Card key={label} className="p-5"><div className="flex items-start justify-between"><p className="text-xs text-white/38">{label}</p><Icon className="size-4 text-white/25" /></div><div className="mt-7 text-2xl font-semibold tracking-[-.04em] text-white">{value}</div><p className="mt-2 text-[10px] text-white/25">Read from Studio Next</p></Card>)}</div>
      <div className="mt-10 flex items-center justify-between"><div><h2 className="text-xl font-semibold tracking-[-.035em]">Your agreements</h2><p className="mt-1 text-xs text-white/35">Customer and provider relationships for this wallet.</p></div><Link to="/agreements" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden sm:inline-flex')}>View all <ArrowRight className="size-3.5" /></Link></div>
      {agreements.length ? <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{agreements.slice(0, 3).map((agreement) => <AgreementCard key={agreement.id} agreement={agreement} />)}</div> : <div className="mt-5"><EmptyState title="No agreements for this wallet" description="Create an agreement or connect the wallet that participates in an existing agreement." action={<Link to="/agreements/new" className={buttonVariants({ size: 'sm' })}>Create agreement</Link>} /></div>}
      <Card className="relative mt-10 overflow-hidden p-6"><div className="absolute -right-16 -top-20 size-64 rounded-full bg-[var(--accent)]/10 blur-3xl" /><div className="relative"><p className="eyebrow">Live protocol workspace</p><h2 className="mt-5 max-w-lg text-3xl font-semibold leading-tight tracking-[-.05em]">Evidence in. Consensus out. Settlement by contract.</h2><p className="mt-4 max-w-xl text-xs leading-6 text-white/42">RECON reads the deployed GenLayer contract directly. Evaluation outcomes, claim flags, and deadlines are never inferred by this interface.</p></div></Card>
    </> : null}
  </div></AppShell>
}

export function ConnectionPrompt({ title, description, action }: { title: string; description: string; action?: ReactNode }) { return <div className="grid min-h-[58vh] place-items-center"><div className="max-w-md text-center"><p className="eyebrow">Wallet required</p><h1 className="mt-4 text-3xl font-semibold tracking-[-.05em]">{title}</h1><p className="mt-4 text-sm leading-7 text-white/45">{description}</p>{action ? <div className="mt-7">{action}</div> : null}</div></div> }
export function LoadingState() { return <div className="grid min-h-[58vh] place-items-center text-sm text-white/45">Reading RECON from Studio Next…</div> }
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) { return <div className="grid min-h-[58vh] place-items-center"><div className="max-w-md text-center"><p className="text-sm text-red-200">{message}</p><Button variant="secondary" className="mt-5" onClick={onRetry}>Retry read</Button></div></div> }
