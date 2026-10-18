import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[.018] px-6 py-14 text-center">
      <div className="mx-auto grid size-11 place-items-center rounded-full bg-white/[.05] text-white/35"><Inbox className="size-5" /></div>
      <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-white/38">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
