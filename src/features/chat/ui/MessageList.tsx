import { useEffect, useRef } from 'react'

import { cn } from '@/shared/lib/cn'
import { Spinner } from '@/shared/ui/Spinner'

import type { ChatMessage } from '../model/types'

export interface MessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
  isStreaming: boolean
}

export function MessageList({ messages, isLoading, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Follow the conversation as it grows. `messages.length` alone would miss
  // streamed text arriving into the last bubble.
  const lastContent = messages.at(-1)?.content ?? ''
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, lastContent])

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-slate-400">
        <Spinner label="Loading conversation" />
      </div>
    )
  }

  // The graph stores system prompts alongside the conversation; they are not
  // part of what the user said or heard.
  const visible = messages.filter((message) => message.role !== 'system')

  if (visible.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center">
        <p className="max-w-sm text-sm text-slate-500">
          No messages yet. Ask a question below to start the conversation.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6" role="log" aria-live="polite">
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
                  'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap',
                  isUser
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-slate-800 ring-1 ring-slate-200 ring-inset',
                )}
              >
                <span className="sr-only">{isUser ? 'You said: ' : 'Assistant said: '}</span>
                {isPending ? (
                  <span className="inline-flex items-center gap-2 text-slate-400">
                    <Spinner className="size-3.5" label={null} />
                    Thinking…
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
