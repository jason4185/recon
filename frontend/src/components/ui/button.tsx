import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 outline-none disabled:pointer-events-none disabled:opacity-45 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] active:translate-y-px',
  {
    variants: {
      variant: {
        primary: 'bg-[var(--accent)] text-[#101014] shadow-[0_10px_30px_rgba(190,178,255,.15)] hover:bg-[var(--accent-strong)]',
        secondary: 'border border-white/10 bg-white/[.055] text-white hover:border-white/20 hover:bg-white/[.09]',
        ghost: 'text-[var(--muted)] hover:bg-white/[.06] hover:text-white',
        danger: 'border border-red-400/20 bg-red-400/10 text-red-200 hover:bg-red-400/15',
      },
      size: {
        sm: 'h-9 px-4 text-xs',
        md: 'h-11 px-5',
        lg: 'h-13 px-7 text-[15px]',
        icon: 'size-10 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
)
Button.displayName = 'Button'

export { buttonVariants }
