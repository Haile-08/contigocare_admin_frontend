import { useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'

import { paths } from '@/app/router/paths'
import { getApiErrorMessage } from '@/shared/api/errors'
import { useTranslation } from '@/shared/i18n'
import { cn } from '@/shared/lib/cn'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Icon } from '@/shared/ui/Icon'
import { Skeleton } from '@/shared/ui/Skeleton'

import {
  useCreateSessionMutation,
  useDeleteSessionMutation,
  useListSessionsQuery,
  useRenameSessionMutation,
} from '../api/sessionsApi'
import type { ChatSession } from '../model/types'

/** Row actions stay hidden until the row is hovered or focused within. */
const ROW_ACTION =
  'grid size-6.5 place-items-center rounded-[7px] text-faint transition-colors hover:bg-surface hover:text-body'

export function SessionSidebar() {
  const navigate = useNavigate()
  const { t } = useTranslation()
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
      t('sessions.confirmDelete', { name: session.name || t('sessions.thisConversation') }),
    )
    if (!confirmed) return

    await deleteSession({ sessionId: session.id, sessionToken: session.token })

    if (activeSessionId === session.id) {
      await navigate(paths.chat, { replace: true })
    }
  }

  return (
    <aside
      aria-label={t('sessions.label')}
      className="flex w-56 shrink-0 flex-col border-r border-line bg-canvas sm:w-72"
    >
      <div className="flex h-12.5 shrink-0 items-center justify-between border-b border-line pr-3 pl-4">
        <h2 className="text-[12.5px] font-medium text-body">{t('sessions.title')}</h2>
        <Button
          size="sm"
          onClick={() => void handleCreate()}
          isLoading={isCreating}
          leadingIcon={<Icon name="plus" className="size-3.25" strokeWidth={2} />}
        >
          {t('sessions.new')}
        </Button>
      </div>

      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex flex-col gap-1.5 p-1">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-8.5 rounded-[9px]" />
            ))}
          </div>
        ) : error ? (
          <Alert tone="error" className="m-1">
            {getApiErrorMessage(error, t)}
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
                  <div className="group flex items-center gap-0.5">
                    <NavLink
                      to={paths.chatSession(session.id)}
                      className={({ isActive }) =>
                        cn(
                          'min-w-0 flex-1 truncate rounded-[9px] px-2.5 py-2 text-[12.5px] transition-colors',
                          isActive
                            ? 'bg-ink font-medium text-on-ink'
                            : 'text-muted hover:bg-surface-sunk hover:text-body',
                        )
                      }
                    >
                      {session.name || t('sessions.untitled')}
                    </NavLink>

                    <div className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <button
                        type="button"
                        aria-label={t('sessions.rename', {
                          name: session.name || t('sessions.fallbackName'),
                        })}
                        onClick={() => {
                          setEditingId(session.id)
                        }}
                        className={ROW_ACTION}
                      >
                        <Icon name="pencil" className="size-3.25" />
                      </button>
                      <button
                        type="button"
                        aria-label={t('sessions.delete', {
                          name: session.name || t('sessions.fallbackName'),
                        })}
                        onClick={() => void handleDelete(session)}
                        className={cn(ROW_ACTION, 'hover:text-critical')}
                      >
                        <Icon name="trash" className="size-3.25" />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-2.5 py-6 text-[11.5px] leading-relaxed text-muted">
            {t('sessions.empty')}
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
  const { t } = useTranslation()
  const [name, setName] = useState(session.name)

  return (
    <form
      className="flex items-center gap-1 py-0.5"
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
        aria-label={t('sessions.nameLabel')}
        onChange={(event) => {
          setName(event.target.value)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onCancel()
        }}
        className="h-8 min-w-0 flex-1 rounded-xs border border-line-soft bg-surface px-2 text-[12.5px] text-body"
      />
      <Button size="sm" type="submit">
        {t('common.save')}
      </Button>
    </form>
  )
}
