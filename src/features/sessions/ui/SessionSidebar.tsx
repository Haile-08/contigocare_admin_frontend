import { useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'

import { paths } from '@/app/router/paths'
import { getApiErrorMessage } from '@/shared/api/errors'
import { cn } from '@/shared/lib/cn'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'

import {
  useCreateSessionMutation,
  useDeleteSessionMutation,
  useListSessionsQuery,
  useRenameSessionMutation,
} from '../api/sessionsApi'
import type { ChatSession } from '../model/types'

export function SessionSidebar() {
  const navigate = useNavigate()
  const { sessionId: activeSessionId } = useParams<{ sessionId: string }>()

  const { data: sessions, isLoading, error } = useListSessionsQuery()
  const [createSession, { isLoading: isCreating }] = useCreateSessionMutation()
  const [renameSession] = useRenameSessionMutation()
  const [deleteSession] = useDeleteSessionMutation()

  const [editingId, setEditingId] = useState<string | null>(null)

  const handleCreate = async (): Promise<void> => {
    try {
      const session = await createSession().unwrap()
      await navigate(paths.chatSession(session.id))
    } catch {
      // The list below surfaces the failure; nothing else to do here.
    }
  }

  const handleDelete = async (session: ChatSession): Promise<void> => {
    const confirmed = globalThis.confirm(
      `Delete "${session.name || 'this conversation'}" and its history? This cannot be undone.`,
    )
    if (!confirmed) return

    await deleteSession({ sessionId: session.id, sessionToken: session.token })

    if (activeSessionId === session.id) {
      await navigate(paths.chat, { replace: true })
    }
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-slate-50">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Conversations
        </h2>
        <Button size="sm" onClick={handleCreate} isLoading={isCreating}>
          New
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {isLoading ? (
          <div className="flex justify-center py-6 text-slate-400">
            <Spinner label="Loading conversations" />
          </div>
        ) : error ? (
          <Alert tone="error" className="mx-1">
            {getApiErrorMessage(error)}
          </Alert>
        ) : sessions && sessions.length > 0 ? (
          <ul className="flex flex-col gap-0.5">
            {sessions.map((session) => (
              <li key={session.id}>
                {editingId === session.id ? (
                  <RenameForm
                    session={session}
                    onCancel={() => {
                      setEditingId(null)
                    }}
                    onSubmit={async (name) => {
                      setEditingId(null)
                      await renameSession({
                        sessionId: session.id,
                        sessionToken: session.token,
                        name,
                      })
                    }}
                  />
                ) : (
                  <div className="group flex items-center gap-1">
                    <NavLink
                      to={paths.chatSession(session.id)}
                      className={({ isActive }) =>
                        cn(
                          'min-w-0 flex-1 truncate rounded-md px-2.5 py-2 text-sm',
                          isActive
                            ? 'bg-white font-medium text-slate-900 ring-1 ring-slate-200 ring-inset'
                            : 'text-slate-600 hover:bg-slate-100',
                        )
                      }
                    >
                      {session.name || 'Untitled conversation'}
                    </NavLink>

                    <div className="flex opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Rename ${session.name || 'conversation'}`}
                        onClick={() => {
                          setEditingId(session.id)
                        }}
                      >
                        Rename
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Delete ${session.name || 'conversation'}`}
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => void handleDelete(session)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-2.5 py-6 text-sm text-slate-500">
            No conversations yet. Start one with “New”.
          </p>
        )}
      </div>
    </aside>
  )
}

interface RenameFormProps {
  session: ChatSession
  onSubmit: (name: string) => void
  onCancel: () => void
}

function RenameForm({ session, onSubmit, onCancel }: RenameFormProps) {
  const [name, setName] = useState(session.name)

  return (
    <form
      className="flex items-center gap-1 px-1 py-1"
      onSubmit={(event) => {
        event.preventDefault()
        const trimmed = name.trim()
        if (trimmed && trimmed !== session.name) onSubmit(trimmed)
        else onCancel()
      }}
    >
      <input
        autoFocus
        value={name}
        maxLength={100}
        aria-label="Conversation name"
        onChange={(event) => {
          setName(event.target.value)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onCancel()
        }}
        className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-2 focus:outline-brand-500"
      />
      <Button size="sm" type="submit">
        Save
      </Button>
    </form>
  )
}
