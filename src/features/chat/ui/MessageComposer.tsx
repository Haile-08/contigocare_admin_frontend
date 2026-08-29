import type { FormEvent, KeyboardEvent } from 'react'

import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
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
      className="border-t border-slate-200 bg-white px-4 py-3"
    >
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <div className="flex-1">
          <label htmlFor="composer" className="sr-only">
            Message
          </label>
          <textarea
            id="composer"
            rows={2}
            value={draft}
            onChange={(event) => {
              dispatch(draftChanged({ sessionId, text: event.target.value }))
            }}
            onKeyDown={handleKeyDown}
            placeholder="Send a message…"
            aria-invalid={isTooLong || undefined}
            aria-describedby={isTooLong ? 'composer-limit' : undefined}
            className={cn(
              'w-full resize-none rounded-lg border px-3 py-2 text-sm text-slate-900',
              'placeholder:text-slate-400 focus:outline-2 focus:outline-offset-0',
              isTooLong
                ? 'border-red-400 focus:outline-red-500'
                : 'border-slate-300 focus:outline-brand-500',
            )}
          />
          {isTooLong ? (
            <p id="composer-limit" className="mt-1 text-xs text-red-600">
              {draft.length.toLocaleString()} / {MAX_MESSAGE_LENGTH.toLocaleString()} characters —
              shorten the message to send it.
            </p>
          ) : null}
        </div>

        <Button type="submit" disabled={!canSend} isLoading={isSending} className="mb-0.5">
          Send
        </Button>
      </div>
    </form>
  )
}
