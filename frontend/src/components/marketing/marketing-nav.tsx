import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { BrandMark } from '../brand-mark'
import { buttonVariants } from '../ui/button'
import { cn } from '../../lib/utils'

const links = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '/agreements', label: 'Explore agreements', route: true },
]

export function MarketingNav() {
  const [open, setOpen] = useState(false)
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="marketing-shell flex h-24 items-center justify-between">
        <BrandMark />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Marketing navigation">
          {links.map((item) => item.route ? (
            <Link key={item.label} to="/agreements" className="text-xs font-medium text-white/50 transition hover:text-white">{item.label}</Link>
          ) : (
            <a key={item.label} href={item.href} className="text-xs font-medium text-white/50 transition hover:text-white">{item.label}</a>
          ))}
        </nav>
        <Link to="/app" className={cn(buttonVariants({ size: 'sm' }), 'hidden md:inline-flex')}>Launch App <ArrowUpRight className="size-3.5" /></Link>
        <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
          <DialogPrimitive.Trigger className="rounded-full border border-white/10 p-2.5 text-white md:hidden" aria-label="Open menu"><Menu className="size-4" /></DialogPrimitive.Trigger>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
            <DialogPrimitive.Content className="fixed inset-x-3 top-3 z-50 rounded-[22px] border border-white/10 bg-[#111216] p-5 outline-none">
              <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
              <div className="flex items-center justify-between"><BrandMark /><DialogPrimitive.Close className="rounded-full p-2 text-white/50"><X className="size-5" /></DialogPrimitive.Close></div>
              <nav className="mt-7 flex flex-col gap-1">
                {links.map((item) => item.route ? <Link key={item.label} to="/agreements" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm text-white/70 hover:bg-white/5">{item.label}</Link> : <a key={item.label} href={item.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm text-white/70 hover:bg-white/5">{item.label}</a>)}
              </nav>
              <Link to="/app" onClick={() => setOpen(false)} className={cn(buttonVariants(), 'mt-5 w-full')}>Launch App</Link>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      </div>
    </header>
  )
}
