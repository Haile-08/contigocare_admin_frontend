import type { FormEvent, KeyboardEvent } from 'react'

import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { useTranslation } from '@/shared/i18n'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'

import { draftChanged, draftCleared, selectDraft } from '../model/chatSlice'
import { MAX_MESSAGE_LENGTH } from '../model/types'

export interface MessageComposerProps {
  sessionId: string
  isSending: boolean
  onSend: (text: string) => void
}

export function MessageComposer({ sessionId, isSending, onSend }: MessageComposerProps) {
  const dispatch = useAppDispatch()
  const { t, fmt } = useTranslation()
  const draft = useAppSelector((state) => selectDraft(state, sessionId))

  const trimmed = draft.trim()
  const isTooLong = draft.length > MAX_MESSAGE_LENGTH
  const canSend = trimmed.length > 0 && !isTooLong && !isSending

  const submit = (): void => {
    if (!canSend) return
    dispatch(draftCleared(sessionId))
    onSend(trimmed)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    submit()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    // Enter sends, Shift+Enter starts a new line. IME composition must not be
    // interrupted — `isComposing` is true mid-word in Japanese/Chinese input.
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 border-t border-line bg-surface px-4 py-3"
    >
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <div className="flex-1">
          <label htmlFor="composer" className="sr-only">
            {t('chat.messageLabel')}
          </label>
          <textarea
            id="composer"
            rows={2}
            value={draft}
            onChange={(event) => {
              dispatch(draftChanged({ sessionId, text: event.target.value }))
            }}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.placeholder')}
            aria-invalid={isTooLong || undefined}
            aria-describedby={isTooLong ? 'composer-limit' : undefined}
            className={cn(
              'w-full resize-none rounded-xs border bg-surface px-3 py-2 text-[12.5px] text-body',
              'placeholder:text-faint transition-colors',
              isTooLong ? 'border-critical' : 'border-line-soft hover:border-line-strong',
            )}
          />
          {isTooLong ? (
            <p id="composer-limit" className="mt-1 text-[11.5px] text-critical">
              {t('chat.tooLong', {
                current: fmt.number(draft.length),
                max: fmt.number(MAX_MESSAGE_LENGTH),
              })}
            </p>
          ) : null}
        </div>

        <Button type="submit" disabled={!canSend} isLoading={isSending} className="mb-0.5">
          {t('chat.send')}
        </Button>
      </div>
    </form>
  )
}
