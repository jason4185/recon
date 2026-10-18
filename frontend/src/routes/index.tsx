import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowDown, ArrowRight, CheckCheck, FileCheck2, Fingerprint, Layers3, LockKeyhole, Scale, ShieldCheck, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { BrandMark } from '../components/brand-mark'
import { HeroPreview } from '../components/marketing/hero-preview'
import { MarketingNav } from '../components/marketing/marketing-nav'
import { buttonVariants } from '../components/ui/button'
import { cn } from '../lib/utils'

export const Route = createFileRoute('/')({ component: LandingPage })

const steps = [
  { number: '01', title: 'Create an agreement', text: 'Define one to five requests, objective acceptance criteria, an assigned provider, reward, and deadline.', icon: Layers3 },
  { number: '02', title: 'Secure GEN in escrow', text: 'The agreement is funded once with the exact reward total for every registered request.', icon: LockKeyhole },
  { number: '03', title: 'Submit evidence', text: 'The provider commits one Netlify JSON file containing responses for the registered requests.', icon: FileCheck2 },
  { number: '04', title: 'Verify and settle', text: 'Validators assess each response. Accepted work earns GEN; unused escrow returns to the customer.', icon: Scale },
]

function FeatureVisual({ type }: { type: number }) {
  if (type === 0) return <div className="mt-8"><div className="flex h-2 overflow-hidden rounded-full bg-white/[.06]"><span className="w-3/5 bg-[var(--accent)]" /><span className="w-2/5 bg-white/20" /></div><div className="mt-3 flex justify-between text-[10px] text-white/35"><span>6 GEN earned</span><span>4 GEN refundable</span></div></div>
  if (type === 1) return <div className="mt-8 flex items-center justify-center gap-2"><span className="grid size-10 place-items-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10"><ShieldCheck className="size-4 text-[var(--accent)]" /></span>{[0,1,2].map((n) => <span key={n} className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/[.035]"><CheckCheck className="size-4 text-white/45" /></span>)}</div>
  if (type === 2) return <div className="mt-8 rounded-xl border border-white/[.07] bg-black/20 p-4 font-mono text-[9px] leading-5 text-white/35"><span className="text-[var(--accent)]">sha256</span>: 8c37f60…476c2<br/><span className="text-emerald-200">exact bytes committed</span></div>
  if (type === 3) return <div className="mt-8 grid grid-cols-5 gap-2">{[1,0,1,0,1].map((ok, i) => <span key={i} className={cn('grid aspect-square place-items-center rounded-lg border text-[10px]', ok ? 'border-emerald-300/15 bg-emerald-300/[.08] text-emerald-200' : 'border-red-300/10 bg-red-300/[.05] text-red-200/70')}>{ok ? '✓' : '—'}</span>)}</div>
  return <div className="mt-8 flex items-center gap-3"><span className="h-px flex-1 bg-white/10"/><span className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-white/45">Mask 10101</span><span className="h-px flex-1 bg-white/10"/></div>
}

function LandingPage() {
  return (
    <div className="overflow-hidden bg-[var(--bg)]">
      <MarketingNav />
      <section className="noise relative min-h-[920px] overflow-hidden pt-40 sm:pt-48">
        <div className="subtle-grid absolute inset-0" />
        <div className="absolute left-1/2 top-[-240px] h-[620px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(99,104,132,.22),rgba(101,73,133,.12)_35%,transparent_70%)] blur-3xl" />
        <div className="marketing-shell relative">
          <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }} className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[.08] bg-white/[.035] px-3 py-1.5 text-[10px] font-semibold tracking-[.08em] text-white/50"><Sparkles className="size-3 text-[var(--accent)]" /> GENLAYER-POWERED SERVICE SETTLEMENT</div>
            <h1 className="text-balance mt-8 text-[clamp(3.5rem,8vw,7.4rem)] font-semibold leading-[.91] tracking-[-.075em] text-white">Work verified.<br/><span className="bg-gradient-to-r from-white via-[#d9d6eb] to-[#8f91a2] bg-clip-text text-transparent">Payments settled.</span></h1>
            <p className="text-balance mx-auto mt-7 max-w-2xl text-sm leading-7 text-white/50 sm:text-base">Create GEN-funded service agreements, submit completed work, and let GenLayer independently determine what gets paid.</p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/app" className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto')}>Launch App <ArrowRight className="size-4" /></Link>
              <a href="#how-it-works" className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), 'w-full sm:w-auto')}>How it works <ArrowDown className="size-4" /></a>
            </div>
          </motion.div>
          <HeroPreview />
        </div>
      </section>

      <section id="how-it-works" className="py-28 sm:py-36">
        <div className="marketing-shell">
          <div className="max-w-2xl"><p className="eyebrow">The RECON flow</p><h2 className="text-balance mt-5 text-4xl font-semibold leading-tight tracking-[-.055em] sm:text-6xl">A direct path from scope to settlement.</h2><p className="mt-5 max-w-xl text-sm leading-7 text-white/45">Customer-defined requirements remain authoritative. The provider submits once, evaluation determines the accepted set, and contract logic calculates the split.</p></div>
          <div className="mt-16 grid gap-px overflow-hidden rounded-[28px] border border-white/[.07] bg-white/[.07] md:grid-cols-2 xl:grid-cols-4">
            {steps.map(({ number, title, text, icon: Icon }) => <div key={number} className="min-h-[310px] bg-[#101116] p-7 sm:p-8"><div className="flex items-center justify-between"><span className="text-[10px] font-bold tracking-[.16em] text-white/25">{number}</span><Icon className="size-5 text-[var(--accent)]" strokeWidth={1.5} /></div><h3 className="mt-24 text-xl font-semibold tracking-[-.035em]">{title}</h3><p className="mt-3 text-xs leading-6 text-white/42">{text}</p></div>)}
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-white/[.055] bg-[#0b0c10] py-28 sm:py-36">
        <div className="marketing-shell">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div className="max-w-2xl"><p className="eyebrow">Built for accountable work</p><h2 className="text-balance mt-5 text-4xl font-semibold leading-tight tracking-[-.055em] sm:text-6xl">Every payment has a reason.</h2></div><p className="max-w-sm text-sm leading-7 text-white/42">RECON keeps scope, evidence, evaluation, and accounting visible in one agreement.</p></div>
          <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            {[
              { title: 'GEN Escrow', text: 'Exact funding is calculated from request count and the fixed reward.', icon: LockKeyhole, span: 'lg:col-span-2' },
              { title: 'Independent Evaluation', text: 'Leader and validators independently assess submitted responses.', icon: ShieldCheck, span: 'lg:col-span-4' },
              { title: 'Evidence Verification', text: 'HTTPS Netlify evidence is committed by exact raw-byte SHA-256.', icon: Fingerprint, span: 'lg:col-span-3' },
              { title: 'Automated Settlement', text: 'A bounded acceptance mask drives the deterministic GEN split.', icon: Scale, span: 'lg:col-span-3' },
              { title: 'Transparent Results', text: 'Every request outcome and both resulting entitlements stay visible.', icon: CheckCheck, span: 'lg:col-span-6' },
            ].map((feature, index) => <motion.article key={feature.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .25 }} transition={{ duration: .45 }} className={cn('min-h-[270px] rounded-[26px] border border-white/[.07] bg-[linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.018))] p-7', feature.span)}><div className="flex items-start justify-between"><feature.icon className="size-5 text-[var(--accent)]" strokeWidth={1.5}/><span className="text-[10px] tracking-[.14em] text-white/20">0{index + 1}</span></div><h3 className="mt-14 text-2xl font-semibold tracking-[-.04em]">{feature.title}</h3><p className="mt-3 max-w-md text-xs leading-6 text-white/42">{feature.text}</p><FeatureVisual type={index} /></motion.article>)}
          </div>
        </div>
      </section>

      <section className="py-28 sm:py-40">
        <div className="marketing-shell">
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(190,178,255,.18),transparent_42%),linear-gradient(135deg,#16171d,#0f1014)] px-6 py-20 text-center sm:px-12 sm:py-28">
            <div className="subtle-grid absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-3xl"><p className="eyebrow">Results over promises</p><h2 className="text-balance mt-5 text-5xl font-semibold leading-[.96] tracking-[-.065em] sm:text-7xl">Pay for results, not promises.</h2><p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/45">Create a live GEN-funded agreement, submit evidence, and let GenLayer settle accepted work.</p><Link to="/app" className={cn(buttonVariants({ size: 'lg' }), 'mt-9')}>Start with RECON <ArrowRight className="size-4" /></Link></div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[.06] py-10">
        <div className="marketing-shell flex flex-col justify-between gap-7 sm:flex-row sm:items-center"><div><BrandMark /><p className="mt-3 text-[11px] text-white/28">Service payment and verification on GenLayer.</p></div><div className="flex flex-wrap gap-5 text-xs text-white/38"><a href="#how-it-works" className="hover:text-white">How it works</a><a href="#features" className="hover:text-white">Features</a><Link to="/agreements" className="hover:text-white">Agreements</Link><Link to="/app" className="hover:text-white">Open app</Link></div></div>
      </footer>
    </div>
  )
}
