import { useState } from 'react'

import type { ChatSession } from '@/features/sessions/model/types'
import { getApiErrorMessage } from '@/shared/api/errors'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'

import {
  useClearMessagesMutation,
  useGetMessagesQuery,
  useStreamMessageMutation,
} from '../api/chatApi'
import { MessageComposer } from './MessageComposer'
import { MessageList } from './MessageList'

export interface ChatPanelProps {
  session: ChatSession
}

export function ChatPanel({ session }: ChatPanelProps) {
  const sessionArgs = { sessionId: session.id, sessionToken: session.token }

  const { data: messages, isLoading, error } = useGetMessagesQuery(sessionArgs)
  const [streamMessage, { isLoading: isStreaming }] = useStreamMessageMutation()
  const [clearMessages, { isLoading: isClearing }] = useClearMessagesMutation()
  const [sendError, setSendError] = useState<string | null>(null)

  const handleSend = async (text: string): Promise<void> => {
    setSendError(null)

    try {
      // Only the new turn is sent: the backend graph already holds the history.
      await streamMessage({
        ...sessionArgs,
        messages: [{ role: 'user', content: text }],
      }).unwrap()
    } catch (streamFailure) {
      setSendError(getApiErrorMessage(streamFailure))
    }
  }

  const handleClear = async (): Promise<void> => {
    const confirmed = globalThis.confirm('Delete every message in this conversation?')
    if (!confirmed) return
    await clearMessages(sessionArgs)
  }

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <h1 className="truncate text-sm font-semibold text-slate-900">
          {session.name || 'Untitled conversation'}
        </h1>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleClear}
          isLoading={isClearing}
          disabled={isStreaming}
        >
          Clear history
        </Button>
      </header>

      {error ? (
        <Alert tone="error" className="m-4">
          {getApiErrorMessage(error)}
        </Alert>
      ) : null}

      <MessageList
        messages={messages ?? []}
        isLoading={isLoading}
        isStreaming={isStreaming}
      />

      {sendError ? (
        <Alert tone="error" className="mx-4 mb-2">
          {sendError}
        </Alert>
      ) : null}

      <MessageComposer sessionId={session.id} isSending={isStreaming} onSend={handleSend} />
    </section>
  )
}
