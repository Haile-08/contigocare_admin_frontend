import { useEffect, useRef } from 'react'

import { useTranslation } from '@/shared/i18n'
import { cn } from '@/shared/lib/cn'
import { Spinner } from '@/shared/ui/Spinner'

import type { ChatMessage } from '../model/types'

export interface MessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
  isStreaming: boolean
}

export function MessageList({ messages, isLoading, isStreaming }: MessageListProps) {
  const { t } = useTranslation()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Follow the conversation as it grows. `messages.length` alone would miss
  // streamed text arriving into the last bubble.
  const lastContent = messages.at(-1)?.content ?? ''
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, lastContent])

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted">
        <Spinner label={t('chat.loading')} />
      </div>
    )
  }

  // The graph stores system prompts alongside the conversation; they are not
  // part of what the user said or heard.
  const visible = messages.filter((message) => message.role !== 'system')

  if (visible.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center">
        <p className="max-w-sm text-[12.5px] leading-relaxed text-muted">
          {t('chat.noMessages')}
        </p>
      </div>
    )
  }

  return (
    <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-4 py-6" role="log" aria-live="polite">
      <ul className="mx-auto flex max-w-3xl flex-col gap-4">
        {visible.map((message, index) => {
          const isUser = message.role === 'user'
          const isPending = isStreaming && index === visible.length - 1 && !message.content

          return (
            <li
              // Messages have no server ids and are strictly append-only, so
              // position is a stable key here.
              key={`${message.role}-${index}`}
              className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-lg px-3.5 py-2.5 text-[12.5px] leading-relaxed whitespace-pre-wrap',
                  isUser
                    ? 'bg-ink text-on-ink'
                    : 'border border-line bg-surface text-body',
                )}
              >
                <span className="sr-only">{isUser ? t('chat.youSaid') : t('chat.assistantSaid')}</span>
                {isPending ? (
                  <span className="inline-flex items-center gap-2 text-muted">
                    <Spinner className="size-3.5" label={null} />
                    {t('chat.thinking')}
                  </span>
                ) : (
                  message.content
                )}
              </div>
            </li>
          )
        })}
      </ul>
      <div ref={bottomRef} />
    </div>
  )
}
