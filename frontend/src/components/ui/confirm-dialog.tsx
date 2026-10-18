import { useState, type ReactNode } from 'react'
import { Button } from './button'
import { Dialog, DialogContent, DialogTrigger } from './dialog'

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  onConfirm,
  variant = 'primary',
}: {
  trigger: ReactNode
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  variant?: 'primary' | 'danger'
}) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title={title} description={description}>
        <div className="mt-7 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant={variant} onClick={() => { onConfirm(); setOpen(false) }}>{confirmLabel}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
