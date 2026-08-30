import { useState } from 'react'

import type { ChatSession } from '@/features/sessions/model/types'
import { getApiErrorMessage } from '@/shared/api/errors'
import { useTranslation } from '@/shared/i18n'
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
  const { t } = useTranslation()
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
      setSendError(getApiErrorMessage(streamFailure, t))
    }
  }

  const handleClear = async (): Promise<void> => {
    const confirmed = globalThis.confirm(t('chat.confirmClear'))
    if (!confirmed) return
    await clearMessages(sessionArgs)
  }

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface">
      <header className="flex h-12.5 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface pr-3 pl-4.5">
        <h1 className="truncate text-[13.5px] font-medium tracking-[-0.01em] text-body">
          {session.name || t('sessions.untitled')}
        </h1>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => void handleClear()}
          isLoading={isClearing}
          disabled={isStreaming}
        >
          {t('chat.clearHistory')}
        </Button>
      </header>

      {error ? (
        <Alert tone="error" className="mx-4.5 mt-4">
          {getApiErrorMessage(error, t)}
        </Alert>
      ) : null}

      <MessageList
        messages={messages ?? []}
        isLoading={isLoading}
        isStreaming={isStreaming}
      />

      {sendError ? (
        <Alert tone="error" className="mx-4.5 mb-2">
          {sendError}
        </Alert>
      ) : null}

      <MessageComposer sessionId={session.id} isSending={isStreaming} onSend={handleSend} />
    </section>
  )
}
