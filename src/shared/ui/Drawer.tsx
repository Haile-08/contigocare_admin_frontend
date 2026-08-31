import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

import { useTranslation } from '@/shared/i18n'
import { cn } from '@/shared/lib/cn'

import { Icon } from './Icon'

/** Everything focusable inside the panel, in document order. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * A right-hand overlay panel: a screen that runs *beside* the console rather
 * than replacing it.
 *
 * It is a modal dialog in the accessibility sense — `aria-modal`, Escape to
 * dismiss, Tab cycles inside it, focus returns to whatever opened it — because
 * that is what it behaves like. What it is not is a route: nothing about it
 * touches the URL, so the screen underneath keeps its scroll position, its
 * queries and its state while the drawer is open.
 *
 * The panel is deliberately wide. A drawer that has to hold a two-column
 * document reviewer is not a 24 rem sidesheet, and squeezing one into that
 * width is how a drawer ends up being scrolled sideways.
 */
export function Drawer({
  open,
  title,
  description,
  onClose,
  className,
  children,
}: {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  className?: string
  children: ReactNode
}) {
  const { t } = useTranslation()
  const panelRef = useRef<HTMLDivElement>(null)

  // The callback lives in a ref so the effect below depends on `open` alone.
  // Depending on `onClose` would re-run it on every parent render, and its
  // first act is to move focus — which would yank the caret out of whatever
  // field the user is typing in.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return

    const opener = document.activeElement as HTMLElement | null
    panelRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') return

      // Without this, Tab walks out of the panel and into the page behind it,
      // which is still rendered and still full of controls.
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
      // Returning focus to the trigger is what makes the drawer feel like an
      // aside rather than a place you were sent to.
      opener?.focus?.()
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label={t('common.close')}
        onClick={onClose}
        className="drawer-scrim absolute inset-0 bg-black/40"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'drawer-panel relative flex h-full w-full flex-col border-l border-line bg-surface outline-none',
          'shadow-[-16px_0_48px_rgba(0,0,0,0.16)]',
          'max-w-[min(100vw,72rem)]',
          className,
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            <h2 className="text-[15px] leading-tight font-medium tracking-[-0.015em] text-body">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 max-w-2xl text-[11.5px] text-muted">{description}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="-mr-1 grid size-8.5 shrink-0 place-items-center rounded-[9px] text-muted transition-colors hover:bg-surface-sunk hover:text-body"
          >
            <Icon name="close" className="size-4.25" />
          </button>
        </header>

        <div className="scroll-slim flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}
