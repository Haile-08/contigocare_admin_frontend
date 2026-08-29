import { Link, useParams } from 'react-router-dom'

import { paths } from '@/app/router/paths'
import { ChatPanel } from '@/features/chat/ui/ChatPanel'
import { useListSessionsQuery } from '@/features/sessions/api/sessionsApi'
import { getApiErrorMessage } from '@/shared/api/errors'
import { Alert } from '@/shared/ui/Alert'
import { Spinner } from '@/shared/ui/Spinner'

export function ChatSessionPage() {
  const { sessionId = '' } = useParams<{ sessionId: string }>()

  // The session-scoped token comes from the sessions list, so the panel reads
  // it out of that cache entry. `selectFromResult` narrows the subscription to
  // this one session: renaming a *different* conversation re-renders nothing
  // here.
  const { session, isLoading, error } = useListSessionsQuery(undefined, {
    selectFromResult: (result) => ({
      session: result.data?.find((candidate) => candidate.id === sessionId),
      isLoading: result.isLoading,
      error: result.error,
    }),
  })

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-slate-400">
        <Spinner className="size-7" label="Loading conversation" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 p-6">
        <Alert tone="error">{getApiErrorMessage(error)}</Alert>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm font-medium text-slate-900">This conversation no longer exists.</p>
        <Link to={paths.chat} className="text-sm text-brand-700 hover:underline">
          Back to conversations
        </Link>
      </div>
    )
  }

  // Remounting per session keeps one conversation's transient UI state from
  // bleeding into the next.
  return <ChatPanel key={session.id} session={session} />
}

export default ChatSessionPage
