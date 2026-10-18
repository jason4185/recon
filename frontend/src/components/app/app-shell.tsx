import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Link, useRouterState } from '@tanstack/react-router'
import { Activity, FilePlus2, LayoutDashboard, Menu, ScrollText, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { BrandMark } from '../brand-mark'
import { WalletControl } from '../../lib/genlayer/wallet'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard },
  { to: '/agreements', label: 'Agreements', icon: ScrollText },
  { to: '/agreements/new', label: 'Create Agreement', icon: FilePlus2 },
  { to: '/activity', label: 'Activity', icon: Activity },
] as const

function AppNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  return <nav className="flex flex-col gap-1" aria-label="Application navigation">
    {navItems.map(({ to, label, icon: Icon }) => {
      const active = to === '/agreements' ? pathname === to || (pathname.startsWith('/agreements/') && pathname !== '/agreements/new') : pathname === to
      return <Link key={to} to={to} onClick={onNavigate} className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition', active ? 'bg-white/[.08] text-white' : 'text-white/45 hover:bg-white/[.045] hover:text-white/80')}>
        <Icon className="size-4" strokeWidth={1.8} />{label}
      </Link>
    })}
  </nav>
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return <div className="min-h-screen bg-[var(--bg)]">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-white/[.065] bg-[#0b0c10] p-5 lg:flex lg:flex-col">
      <div className="flex items-center justify-between px-2"><BrandMark /></div>
      <div className="mt-10"><AppNavigation /></div>
      <div className="mt-auto rounded-2xl border border-white/[.07] bg-white/[.035] p-4">
        <p className="text-xs font-semibold text-white">Studio Next</p>
        <p className="mt-1.5 text-[11px] leading-5 text-white/38">RECON reads and writes use the connected wallet on GenLayer.</p>
      </div>
    </aside>
    <div className="lg:pl-[248px]">
      <header className="sticky top-0 z-20 border-b border-white/[.06] bg-[#090a0d]/85 backdrop-blur-xl">
        <div className="flex h-[72px] items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
              <DialogPrimitive.Trigger className="rounded-full border border-white/10 p-2.5 text-white" aria-label="Open navigation"><Menu className="size-4" /></DialogPrimitive.Trigger>
              <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
                <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 w-[min(84vw,320px)] border-r border-white/10 bg-[#0b0c10] p-5 outline-none">
                  <DialogPrimitive.Title className="sr-only">Application navigation</DialogPrimitive.Title>
                  <div className="flex items-center justify-between"><BrandMark /><DialogPrimitive.Close className="rounded-full p-2 text-white/50 hover:bg-white/5 hover:text-white"><X className="size-5" /></DialogPrimitive.Close></div>
                  <div className="mt-9"><AppNavigation onNavigate={() => setOpen(false)} /></div>
                  <div className="mt-7 border-t border-white/[.07] pt-6"><WalletControl compact /></div>
                </DialogPrimitive.Content>
              </DialogPrimitive.Portal>
            </DialogPrimitive.Root>
            <BrandMark compact />
          </div>
          <p className="hidden text-sm text-white/38 lg:block">RECON workspace</p>
          <WalletControl />
        </div>
      </header>
      <main className="px-4 py-7 sm:px-8 sm:py-9 xl:px-10">{children}</main>
    </div>
  </div>
}
