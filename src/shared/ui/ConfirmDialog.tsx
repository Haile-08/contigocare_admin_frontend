import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

import { useTranslation } from '@/shared/i18n'
import { cn } from '@/shared/lib/cn'

import { Button } from './Button'

/** Everything focusable inside the panel, in document order. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * A centred modal for an action that cannot be taken back.
 *
 * Deliberately not the `Drawer`. A drawer is a place to *work* — it runs beside
 * the console and the screen behind it stays live. This is the opposite: it
 * asks one question, in the middle of the screen, and the only way past it is
 * to answer. That is the right shape for an erasure and the wrong shape for
 * anything the operator might want to consult the page while deciding.
 *
 * The cancel button takes focus rather than the confirm button, because the
 * first Enter after a dialog appears is regularly one the person had already
 * pressed for something else.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = 'danger',
  isLoading = false,
  confirmDisabled = false,
  onConfirm,
  onClose,
  children,
}: {
  open: boolean
  title: string
  description?: string
  confirmLabel: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  isLoading?: boolean
  confirmDisabled?: boolean
  onConfirm: () => void
  onClose: () => void
  /** Anything the decision needs: a scope choice, a warning, a failure alert. */
  children?: ReactNode
}) {
  const { t } = useTranslation()
  const panelRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  // Held in a ref so the effect depends on `open` alone — re-running it on
  // every parent render would move focus while the operator is choosing.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return

    const opener = document.activeElement as HTMLElement | null
    cancelRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return

      const focusable = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)]
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return

      const active = document.activeElement

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      opener?.focus?.()
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t('common.cancel')}
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'relative flex w-full max-w-md flex-col gap-3 rounded-md border border-line bg-surface p-5 outline-none',
          'shadow-[0_24px_64px_rgba(0,0,0,0.24)]',
        )}
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-[14px] leading-tight font-medium tracking-[-0.01em] text-body">
            {title}
          </h2>
          {description ? (
            <p className="text-[11.5px] leading-relaxed text-muted">{description}</p>
          ) : null}
        </div>

        {children}

        <div className="mt-1 flex items-center justify-end gap-2">
          <Button ref={cancelRef} variant="secondary" size="sm" onClick={onClose}>
            {cancelLabel ?? t('common.cancel')}
          </Button>
          <Button
            variant={tone}
            size="sm"
            isLoading={isLoading}
            disabled={confirmDisabled}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
