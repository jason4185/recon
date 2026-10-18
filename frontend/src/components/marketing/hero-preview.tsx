import { Check, Minus, ShieldCheck } from 'lucide-react'
import { motion } from 'motion/react'

const outcomes = [true, false, true, false, true]

export function HeroPreview() {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .7, delay: .15, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto mt-16 max-w-5xl"
    >
      <div className="absolute -inset-8 -z-10 rounded-[48px] bg-[radial-gradient(circle_at_50%_20%,rgba(189,173,255,.18),transparent_62%)] blur-2xl" />
      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#111217]/90 shadow-[0_50px_120px_rgba(0,0,0,.55)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/[.07] px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5"><i className="size-2 rounded-full bg-white/20" /><i className="size-2 rounded-full bg-white/12" /><i className="size-2 rounded-full bg-white/8" /></div>
            <span className="hidden text-[10px] font-bold uppercase tracking-[.15em] text-white/30 sm:inline">Illustrative example</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)]/10 px-2.5 py-1 text-[10px] font-bold tracking-[.08em] text-[var(--accent)]"><ShieldCheck className="size-3" /> EVALUATED</span>
        </div>
        <div className="grid lg:grid-cols-[1.2fr_.8fr]">
          <div className="border-b border-white/[.07] p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-white/30">AGR-1042 · Five requests</p><h3 className="mt-2 text-xl font-semibold tracking-[-.035em] text-white sm:text-2xl">Spring collection launch strategy</h3></div>
              <div className="sm:text-right"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-white/30">Escrow</p><p className="mt-1 text-2xl font-semibold tracking-[-.04em] text-white">10 <span className="text-xs tracking-[.1em] text-[var(--accent)]">GEN</span></p></div>
            </div>
            <div className="mt-8 space-y-2">
              {['Audience definition', 'Channel strategy', 'Budget allocation', 'Launch calendar', 'Success metrics'].map((label, index) => (
                <motion.div key={label} initial={false} animate={{ opacity: 1, x: 0 }} transition={{ delay: .35 + index * .06 }} className="flex items-center justify-between rounded-xl border border-white/[.055] bg-white/[.025] px-4 py-3">
                  <span className="flex items-center gap-3 text-xs text-white/65"><span className="text-[10px] text-white/25">0{index + 1}</span>{label}</span>
                  <span className={outcomes[index] ? 'inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.08em] text-emerald-200' : 'inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.08em] text-red-200/80'}>{outcomes[index] ? <Check className="size-3.5" /> : <Minus className="size-3.5" />}{outcomes[index] ? 'Accepted' : 'Rejected'}</span>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="p-6 sm:p-8">
            <p className="text-xs font-semibold text-white">Settlement distribution</p>
            <p className="mt-1 text-[11px] text-white/35">3 accepted × 2 GEN per request</p>
            <div className="mt-9 flex h-3 overflow-hidden rounded-full bg-white/[.06]"><motion.div initial={false} animate={{ width: '60%' }} transition={{ duration: .8, delay: .6 }} className="bg-[var(--accent)]" /><motion.div initial={false} animate={{ width: '40%' }} transition={{ duration: .8, delay: .7 }} className="bg-white/20" /></div>
            <div className="mt-7 space-y-3">
              <div className="rounded-2xl bg-[var(--accent)]/[.08] p-5"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-white/35">Provider entitlement</p><p className="mt-2 text-3xl font-semibold tracking-[-.05em]">6 <span className="text-[11px] tracking-[.1em] text-[var(--accent)]">GEN</span></p></div>
              <div className="rounded-2xl bg-white/[.04] p-5"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-white/35">Customer refund</p><p className="mt-2 text-3xl font-semibold tracking-[-.05em]">4 <span className="text-[11px] tracking-[.1em] text-white/45">GEN</span></p></div>
            </div>
            <p className="mt-5 text-[10px] leading-4 text-white/25">Illustrative settlement example. Live agreements are read from the deployed contract.</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
