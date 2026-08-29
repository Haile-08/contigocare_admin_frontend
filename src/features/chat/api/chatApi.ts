import { withSessionToken } from '@/shared/api/authScope'
import { baseApi } from '@/shared/api/baseApi'
import { env } from '@/shared/config/env'
import { logger } from '@/shared/lib/logger'

import type { ChatMessage, SendMessageArgs, SessionScopedArgs } from '../model/types'
import { chatResponseSchema, streamChunkSchema } from '../model/types'

/** How often streamed text is written into the cache, in ms. */
const STREAM_FLUSH_INTERVAL = 60

/**
 * Cache key for the message list.
 *
 * `GET /auth/sessions` mints a *new* session token on every call, so the token
 * must be kept out of the key — otherwise each sessions refetch would orphan
 * the previous message cache and break optimistic updates.
 */
function messagesCacheKey(sessionId: string): string {
  return `getMessages(${sessionId})`
}

/** The handle RTK Query returns from an optimistic cache update. */
interface CachePatch {
  undo: () => void
}

/** Parses one `data:` payload, tolerating anything malformed. */
function parseStreamFrame(payload: string): { content: string; done: boolean } | null {
  try {
    const parsed = streamChunkSchema.safeParse(JSON.parse(payload))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMessages: builder.query<ChatMessage[], SessionScopedArgs>({
      query: ({ sessionToken }) => ({
        url: '/chatbot/messages',
        ...withSessionToken(sessionToken),
      }),
      extraOptions: { authScope: 'session' },
      serializeQueryArgs: ({ queryArgs }) => messagesCacheKey(queryArgs.sessionId),
      transformResponse: (response: unknown): ChatMessage[] =>
        chatResponseSchema.parse(response).messages,
      providesTags: (_result, _error, { sessionId }) => [{ type: 'Messages', id: sessionId }],
    }),

    /** Non-streaming send. Kept for environments where SSE is proxied away. */
    sendMessage: builder.mutation<ChatMessage[], SendMessageArgs>({
      query: ({ sessionToken, messages }) => ({
        url: '/chatbot/chat',
        method: 'POST',
        body: { messages },
        ...withSessionToken(sessionToken),
      }),
      extraOptions: { authScope: 'session' },
      transformResponse: (response: unknown): ChatMessage[] =>
        chatResponseSchema.parse(response).messages,
      invalidatesTags: (_result, _error, { sessionId }) => [
        { type: 'Messages', id: sessionId },
        // The backend auto-names a session from its first message.
        { type: 'Session', id: 'LIST' },
      ],
    }),

    clearMessages: builder.mutation<void, SessionScopedArgs>({
      query: ({ sessionToken }) => ({
        url: '/chatbot/messages',
        method: 'DELETE',
        ...withSessionToken(sessionToken),
      }),
      extraOptions: { authScope: 'session' },
      onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          chatApi.util.updateQueryData('getMessages', args, (draft) => {
            draft.length = 0
          }),
        )

        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
    }),

    /**
     * Streaming send (`POST /chatbot/chat/stream`, SSE).
     *
     * `fetchBaseQuery` resolves a request only once the body is complete, so a
     * token-by-token stream needs a custom `queryFn`. Everything else stays
     * inside RTK Query: chunks are written straight into the `getMessages`
     * cache entry, so the UI reads one source of truth and needs no separate
     * "streaming message" state of its own.
     */
    streamMessage: builder.mutation<{ content: string }, SendMessageArgs>({
      extraOptions: { authScope: 'session' },
      queryFn: async ({ sessionId, sessionToken, messages }, api) => {
        const cacheArgs: SessionScopedArgs = { sessionId, sessionToken }
        const outgoing = messages.at(-1)

        // `BaseQueryApi.dispatch` is typed too loosely for TypeScript to keep
        // the thunk's return value, so the patch handle is restored here — in
        // one helper rather than at every call site.
        const patchMessages = (recipe: (draft: ChatMessage[]) => void): CachePatch =>
          (api.dispatch as (thunk: unknown) => CachePatch)(
            chatApi.util.updateQueryData('getMessages', cacheArgs, recipe),
          )

        // Show the user's message and an empty assistant bubble immediately.
        const optimistic = patchMessages((draft) => {
          if (outgoing) draft.push(outgoing)
          draft.push({ role: 'assistant', content: '' })
        })

        let assistantText = ''
        let flushTimer: ReturnType<typeof setTimeout> | null = null
        let rolledBack = false

        const rollback = (): void => {
          rolledBack = true
          optimistic.undo()
        }

        const commit = (): void => {
          if (rolledBack) return
          patchMessages((draft) => {
            const last = draft.at(-1)
            if (last?.role === 'assistant') last.content = assistantText
          })
        }

        // Chunks arrive faster than the screen refreshes; batch them so a long
        // reply costs a handful of renders rather than hundreds.
        const scheduleCommit = (): void => {
          if (flushTimer) return
          flushTimer = setTimeout(() => {
            flushTimer = null
            commit()
          }, STREAM_FLUSH_INTERVAL)
        }

        try {
          const response = await fetch(`${env.apiBaseUrl}/chatbot/chat/stream`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'text/event-stream',
              Authorization: `Bearer ${sessionToken}`,
            },
            body: JSON.stringify({ messages }),
            signal: api.signal,
          })

          if (!response.ok || !response.body) {
            rollback()
            return {
              error: {
                status: response.status,
                data: await response.json().catch(() => null),
              },
            }
          }

          const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
          let buffer = ''

          for (;;) {
            const { value, done } = await reader.read()
            if (done) break

            buffer += value
            const frames = buffer.split('\n\n')
            // The trailing element is an incomplete frame; keep it buffered.
            buffer = frames.pop() ?? ''

            for (const frame of frames) {
              const payload = frame
                .split('\n')
                .filter((line) => line.startsWith('data:'))
                .map((line) => line.slice(5).trim())
                .join('')

              if (!payload) continue

              const chunk = parseStreamFrame(payload)
              if (!chunk) {
                logger.warn('discarding malformed stream frame')
                continue
              }

              if (chunk.content) {
                assistantText += chunk.content
                scheduleCommit()
              }

              if (chunk.done) {
                await reader.cancel()
                break
              }
            }
          }

          return { data: { content: assistantText } }
        } catch (error) {
          if (api.signal.aborted) {
            // Deliberate cancellation: keep whatever streamed in so far.
            return { data: { content: assistantText } }
          }

          rollback()
          return {
            error: {
              status: 'FETCH_ERROR' as const,
              error: error instanceof Error ? error.message : 'Streaming failed',
            },
          }
        } finally {
          if (flushTimer) clearTimeout(flushTimer)
          commit()
        }
      },

      // Deliberately no `Messages` invalidation: the streamed text is already
      // what the server persisted, and refetching immediately would race the
      // backend's write. The session list *is* refreshed — the first message
      // gives the session its name.
      invalidatesTags: [{ type: 'Session', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetMessagesQuery,
  useSendMessageMutation,
  useClearMessagesMutation,
  useStreamMessageMutation,
} = chatApi
