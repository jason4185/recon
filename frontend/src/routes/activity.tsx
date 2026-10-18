import { createFileRoute } from '@tanstack/react-router'
import { Activity } from 'lucide-react'
import { AppShell } from '../components/app/app-shell'
import { EmptyState } from '../components/app/empty-state'
import { PageHeader } from '../components/app/page-header'
import { Card } from '../components/ui/card'

export const Route = createFileRoute('/activity')({ component: ActivityPage })

function ActivityPage() {
  return <AppShell><div className="mx-auto max-w-5xl"><PageHeader eyebrow="Protocol history" title="Activity" description="RECON V1 exposes agreement state views, not a historical event index. This page does not invent activity from local browser state." /><Card className="p-6 sm:p-8"><EmptyState title="No indexed activity available" description="Use an agreement's onchain state and the Studio Next Explorer transaction link for verified history. A future indexer can populate this view without changing the contract adapter." action={<Activity className="mx-auto mt-4 size-5 text-white/25" />} /></Card></div></AppShell>
}
