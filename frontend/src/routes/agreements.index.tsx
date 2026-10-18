import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus, Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AgreementCard } from '../components/app/agreement-card'
import { AppShell } from '../components/app/app-shell'
import { EmptyState } from '../components/app/empty-state'
import { PageHeader } from '../components/app/page-header'
import { buttonVariants } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { getReadClient } from '../lib/genlayer/client'
import { listAgreements } from '../lib/genlayer/reads'
import { useWallet } from '../lib/genlayer/wallet'
import type { AgreementStatus } from '../lib/genlayer/types'

export const Route = createFileRoute('/agreements/')({ component: AgreementsPage })

function AgreementsPage() {
  const wallet = useWallet()
  const connected = wallet.status === 'connected' && Boolean(wallet.address)
  const query = useQuery({ queryKey: ['recon', 'agreements', 'explorer'], queryFn: () => listAgreements({ limit: 50 }, getReadClient()), enabled: connected, staleTime: 15_000 })
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | AgreementStatus>('all')
  const [relationship, setRelationship] = useState<'all' | 'customer' | 'provider'>('all')
  const filtered = useMemo(() => (query.data?.agreements ?? []).filter((agreement) => {
    const term = search.trim().toLowerCase()
    const matchesSearch = !term || agreement.title.toLowerCase().includes(term) || agreement.id === term || agreement.provider.toLowerCase().includes(term) || agreement.customer.toLowerCase().includes(term)
    const matchesStatus = status === 'all' || agreement.status === status
    const matchesRelationship = relationship === 'all' || (relationship === 'customer' ? agreement.customer.toLowerCase() === wallet.address?.toLowerCase() : agreement.provider.toLowerCase() === wallet.address?.toLowerCase())
    return matchesSearch && matchesStatus && matchesRelationship
  }), [query.data?.agreements, search, status, relationship, wallet.address])
  return <AppShell><div className="mx-auto max-w-[1400px]">
    {!connected ? <div className="mt-12"><EmptyState title="Connect to explore agreements" description="The explorer displays agreements read from the deployed RECON contract." action={<button type="button" onClick={() => void wallet.connect()} className={buttonVariants()}>Connect wallet</button>} /></div> : null}
    {connected && query.isPending ? <div className="grid min-h-[58vh] place-items-center text-sm text-white/45">Reading agreement count and records…</div> : null}
    {connected && query.isError ? <div className="mt-12"><EmptyState title="The agreement read failed" description={query.error instanceof Error ? query.error.message : 'Studio Next did not return agreement data.'} action={<button type="button" onClick={() => void query.refetch()} className={buttonVariants({ variant: 'secondary' })}>Retry read</button>} /></div> : null}
    {connected && query.data && !query.isError ? <><PageHeader eyebrow="Agreement explorer" title="Agreements" description={`Showing up to ${query.data.agreements.length} of ${query.data.total} agreements returned by Studio Next.`} action={<Link to="/agreements/new" className={buttonVariants()}><Plus className="size-4" /> Create agreement</Link>} /><div className="flex flex-col gap-3 rounded-[20px] border border-white/[.07] bg-white/[.025] p-3 md:flex-row"><label className="relative flex-1"><span className="sr-only">Search agreements</span><Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/25" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title, ID, or address" className="border-0 bg-black/20 pl-11" /></label><div className="grid grid-cols-2 gap-3 md:flex"><label className="relative"><span className="sr-only">Filter by status</span><select value={status} onChange={(event) => setStatus(event.target.value as 'all' | AgreementStatus)} className="h-12 min-w-36 appearance-none rounded-xl border border-white/10 bg-[#111216] px-4 pr-9 text-xs text-white/70 outline-none focus:border-[var(--accent)]"><option value="all">All statuses</option><option value="FUNDED">Funded</option><option value="EVALUATING">Evaluating</option><option value="EVALUATED">Evaluated</option><option value="EXPIRED">Expired</option><option value="CLOSED">Closed</option></select><SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-white/30" /></label><label><span className="sr-only">Filter by relationship</span><select value={relationship} onChange={(event) => setRelationship(event.target.value as 'all' | 'customer' | 'provider')} className="h-12 min-w-40 rounded-xl border border-white/10 bg-[#111216] px-4 text-xs text-white/70 outline-none focus:border-[var(--accent)]"><option value="all">All relationships</option><option value="customer">Customer agreements</option><option value="provider">Provider agreements</option></select></label></div></div><div className="mt-5 flex items-center justify-between text-xs text-white/35"><span>{filtered.length} loaded result{filtered.length === 1 ? '' : 's'}</span>{search || status !== 'all' || relationship !== 'all' ? <button type="button" onClick={() => { setSearch(''); setStatus('all'); setRelationship('all') }} className="text-[var(--accent)]">Clear filters</button> : null}</div>{filtered.length ? <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{filtered.map((agreement) => <AgreementCard key={agreement.id} agreement={agreement} />)}</div> : <div className="mt-5"><EmptyState title="No matching onchain agreements" description="Adjust the filters or create a new agreement from this wallet." /></div>}</> : null}
  </div></AppShell>
}
