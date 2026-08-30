import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

import { chatApi } from '@/features/chat/api/chatApi'
import type { ChatMessage } from '@/features/chat/model/types'
import { sessionsApi } from '@/features/sessions/api/sessionsApi'
import type { ChatSession } from '@/features/sessions/model/types'
import { baseApi } from '@/shared/api/baseApi'

/**
 * The dashboard's numbers.
 *
 * The API has no metrics endpoint, so this derives everything from the two
 * endpoints that do exist: the session list, and each session's transcript.
 * That is a deliberate constraint rather than a placeholder — every figure on
 * the dashboard is counted from real messages, and nothing on the screen is a
 * number the backend cannot back up.
 *
 * It gets at them by *dispatching the existing endpoints* rather than issuing
 * its own requests. Three things follow for free: the session-scoped tokens are
 * attached the way the chat feature already attaches them, a 401 from one
 * conversation is scoped as a session failure instead of signing the user out,
 * and the transcripts land in the same cache entries the chat screen reads — so
 * opening a conversation from here is instant.
 *
 * The cost is one request per conversation, so the screen samples the most
 * recent `sample` conversations rather than the whole history, and says so on
 * the page. Raising the sample is a control the user operates; it is not a
 * quiet default that grows into a hundred requests.
 */

export interface ConversationMetric {
  id: string
  name: string
  messages: number
  userMessages: number
  assistantMessages: number
  /** The last thing said, for the activity list. */
  preview: string | null
  previewRole: 'user' | 'assistant' | null
  /** True when this conversation's transcript could not be read. */
  unavailable: boolean
}

export interface Overview {
  /** Every conversation the account has, sampled or not. */
  conversations: number
  /** How many of them were actually read for this snapshot. */
  sampled: number
  messages: number
  userMessages: number
  assistantMessages: number
  /** Sampled conversations holding at least one message. */
  active: number
  /** Sampled conversations still waiting for a first message. */
  empty: number
  /** Mean messages per *active* conversation — an empty thread is not an average. */
  averageMessages: number
  /** One row per sampled conversation, busiest first. */
  rows: ConversationMetric[]
  /** True when the sample does not cover every conversation. */
  partial: boolean
}

/**
 * What dispatching a query thunk resolves to. `BaseQueryApi.dispatch` is typed
 * too loosely to carry the thunk's own return type, so the two shapes this
 * module actually uses are declared here rather than cast away with `any`.
 */
interface QueryOutcome<T> {
  data?: T
  error?: unknown
}

type Dispatched = <T>(thunk: unknown) => Promise<QueryOutcome<T>>

/** System prompts live in the transcript but are not part of the conversation. */
function isVisible(message: ChatMessage): boolean {
  return message.role !== 'system'
}

function summarise(session: ChatSession, messages: ChatMessage[] | undefined): ConversationMetric {
  // Possibly empty. Naming an untitled conversation is display, not data, so
  // the fallback belongs in the view — where there is a language to write it in.
  const name = session.name

  if (!messages) {
    return {
      id: session.id,
      name,
      messages: 0,
      userMessages: 0,
      assistantMessages: 0,
      preview: null,
      previewRole: null,
      unavailable: true,
    }
  }

  const visible = messages.filter(isVisible)
  const last = visible.at(-1)
  const lastRole = last?.role

  return {
    id: session.id,
    name,
    messages: visible.length,
    userMessages: visible.filter((message) => message.role === 'user').length,
    assistantMessages: visible.filter((message) => message.role === 'assistant').length,
    preview: last?.content.trim() || null,
    previewRole: lastRole === 'user' || lastRole === 'assistant' ? lastRole : null,
    unavailable: false,
  }
}

export const metricsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOverview: builder.query<Overview, { sample: number }>({
      queryFn: async ({ sample }, api) => {
        const dispatch = api.dispatch as unknown as Dispatched

        const sessionsResult = await dispatch<ChatSession[]>(
          sessionsApi.endpoints.listSessions.initiate(undefined, { subscribe: false }),
        )

        if (sessionsResult.error) {
          return { error: sessionsResult.error as FetchBaseQueryError }
        }

        const sessions = sessionsResult.data ?? []
        const sampled = sessions.slice(0, sample)

        // One transcript per conversation. They are independent reads, so they
        // go out together rather than in a waterfall.
        const rows = await Promise.all(
          sampled.map(async (session) => {
            const result = await dispatch<ChatMessage[]>(
              chatApi.endpoints.getMessages.initiate(
                { sessionId: session.id, sessionToken: session.token },
                { subscribe: false },
              ),
            )

            return summarise(session, result.error ? undefined : result.data)
          }),
        )

        const readable = rows.filter((row) => !row.unavailable)
        const messages = readable.reduce((total, row) => total + row.messages, 0)
        const active = readable.filter((row) => row.messages > 0).length

        return {
          data: {
            conversations: sessions.length,
            sampled: readable.length,
            messages,
            userMessages: readable.reduce((total, row) => total + row.userMessages, 0),
            assistantMessages: readable.reduce((total, row) => total + row.assistantMessages, 0),
            active,
            empty: readable.length - active,
            averageMessages: active === 0 ? 0 : messages / active,
            rows: [...rows].sort((a, b) => b.messages - a.messages),
            partial: sampled.length < sessions.length,
          },
        }
      },

      // Refetches when a conversation is created, renamed or deleted, and when
      // a transcript changes — the same tags the chat feature already emits.
      providesTags: (result) => [
        { type: 'Session' as const, id: 'LIST' },
        ...(result?.rows ?? []).map((row) => ({ type: 'Messages' as const, id: row.id })),
      ],
    }),
  }),
})

export const { useGetOverviewQuery } = metricsApi
