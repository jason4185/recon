import { formatGen } from '../../lib/genlayer/amounts'
import { cn } from '../../lib/utils'

export function GenAmount({ amount, size = 'md', muted = false }: { amount: bigint; size?: 'sm' | 'md' | 'lg'; muted?: boolean }) {
  return <span className={cn('inline-flex items-baseline gap-1 font-semibold tracking-[-.03em]', size === 'sm' && 'text-sm', size === 'md' && 'text-base', size === 'lg' && 'text-2xl', muted ? 'text-white/55' : 'text-white')}>
    {formatGen(amount)} <span className={cn('font-bold tracking-[.08em] text-[var(--accent)]', size === 'lg' ? 'text-xs' : 'text-[9px]')}>GEN</span>
  </span>
}
