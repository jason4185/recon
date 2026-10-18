import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn('min-h-28 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-[var(--accent)]/60 focus:ring-2 focus:ring-[var(--accent)]/10 disabled:cursor-not-allowed disabled:opacity-50', className)}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'
