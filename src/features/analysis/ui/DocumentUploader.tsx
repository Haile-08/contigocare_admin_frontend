import { useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'

import { useTranslation } from '@/shared/i18n'
import { cn } from '@/shared/lib/cn'
import { formatBytes } from '@/shared/lib/format'
import { Alert } from '@/shared/ui/Alert'
import { Icon } from '@/shared/ui/Icon'
import { Spinner } from '@/shared/ui/Spinner'

const ACCEPTED = '.pdf,.png,.jpg,.jpeg,.webp,.txt'
const ACCEPTED_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
])
const MAX_BYTES = 15 * 1024 * 1024

interface DocumentUploaderProps {
  isLoading: boolean
  /**
   * Whether a file may not be chosen yet — the patient ID is missing. The zone
   * stays pressable so it can say why and send the operator to the field.
   */
  locked?: boolean
  onLockedAttempt?: () => void
  onSelect: (file: File) => void
}

/**
 * The drop zone.
 *
 * The client-side type and size checks are a courtesy, not a control — the
 * server sniffs magic bytes and enforces the real limit. Their job is to save
 * an operator a sixty-second OCR round trip that was always going to end in a
 * 400.
 */
export function DocumentUploader({ isLoading, locked = false, onLockedAttempt, onSelect }: DocumentUploaderProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Only the name, for the loading line: OCR takes long enough that "which file"
  // is worth confirming. The file itself is handed straight on.
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFile = (file: File | undefined): void => {
    if (!file) return
    setError(null)

    if (file.size > MAX_BYTES) {
      setError(t('upload.tooLarge', { size: formatBytes(MAX_BYTES) }))
      return
    }

    // An empty `type` is common for files dragged from some file managers, so
    // it is allowed through for the server to sniff rather than rejected here.
    if (file.type && !ACCEPTED_TYPES.has(file.type)) {
      setError(t('upload.wrongType'))
      return
    }

    setFileName(file.name)
    onSelect(file)
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    handleFile(event.target.files?.[0])
    // Reset, so selecting the same file twice in a row still fires a change.
    event.target.value = ''
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault()
    setDragging(false)
    if (isLoading) return
    if (locked) {
      onLockedAttempt?.()
      return
    }
    handleFile(event.dataTransfer.files?.[0])
  }

  return (
    <div className="flex flex-col gap-3">
      {/* A real <button> wrapping the zone: drag-and-drop is a mouse-only
          affordance, and the keyboard path has to be a focusable control that
          opens the picker. */}
      <div
        onDragOver={(event) => {
          event.preventDefault()
          if (!isLoading && !locked) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'group relative rounded-sm border border-dashed transition-colors duration-150',
          dragging
            ? 'border-ink bg-brand-soft'
            : locked
              ? 'border-line bg-surface-sunk/60'
              : 'border-line-strong bg-canvas hover:border-ink/60 hover:bg-surface-sunk',
          isLoading && 'pointer-events-none',
        )}
      >
        <button
          type="button"
          disabled={isLoading}
          aria-busy={isLoading || undefined}
          onClick={() => (locked ? onLockedAttempt?.() : inputRef.current?.click())}
          className="flex w-full flex-col items-center gap-3 rounded-sm px-6 py-10 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {isLoading ? (
            <>
              <Spinner className="size-6" label={null} />
              <div className="flex max-w-full flex-col gap-1">
                <p className="truncate text-[13px] font-medium text-body">
                  {fileName ? t('upload.processingFile', { name: fileName }) : t('upload.processing')}
                </p>
                {/* OCR is slow enough that silence reads as a hang. */}
                <p className="text-[11.5px] text-faint">{t('upload.processingHint')}</p>
              </div>
            </>
          ) : locked ? (
            <>
              <span className="grid size-11 place-items-center rounded-full bg-surface text-faint">
                <Icon name="user" className="size-5" />
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-[13px] font-medium text-muted">{t('upload.locked')}</p>
                <p className="text-[11.5px] text-faint">{t('upload.hint')}</p>
              </div>
            </>
          ) : (
            <>
              <span
                className={cn(
                  'grid size-11 place-items-center rounded-full transition-colors duration-150',
                  dragging ? 'bg-ink text-on-ink' : 'bg-surface-sunk text-muted group-hover:text-body',
                )}
              >
                <Icon name="upload" className="size-5" />
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-[13px] font-medium text-body">
                  {dragging ? t('upload.dropNow') : t('upload.cta')}
                </p>
                <p className="text-[11.5px] text-faint">{t('upload.hint')}</p>
              </div>
            </>
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          onChange={handleChange}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <p className="flex items-start gap-2 text-[11.5px] leading-relaxed text-faint">
        <Icon name="shield" className="mt-0.5 size-3.5 shrink-0" />
        <span>{t('upload.privacyNote')}</span>
      </p>
    </div>
  )
}
