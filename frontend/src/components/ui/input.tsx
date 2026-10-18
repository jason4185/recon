import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn('h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[var(--accent)]/60 focus:ring-2 focus:ring-[var(--accent)]/10 disabled:cursor-not-allowed disabled:opacity-50', className)}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
