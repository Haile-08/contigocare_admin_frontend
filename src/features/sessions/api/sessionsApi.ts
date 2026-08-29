import { baseApi } from '@/shared/api/baseApi'
import { withSessionToken } from '@/shared/api/authScope'

import type { ChatSession } from '../model/types'
import { sessionListResponseSchema, sessionResponseSchema, toChatSession } from '../model/types'

interface RenameSessionArgs {
  sessionId: string
  /** The token for *this* session — the API rejects any other session's token. */
  sessionToken: string
  name: string
}

interface DeleteSessionArgs {
  sessionId: string
  sessionToken: string
}

export const sessionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listSessions: builder.query<ChatSession[], void>({
      query: () => '/auth/sessions',
      transformResponse: (response: unknown): ChatSession[] =>
        sessionListResponseSchema.parse(response).map(toChatSession),
      providesTags: (result) => [
        { type: 'Session' as const, id: 'LIST' },
        ...(result ?? []).map((session) => ({ type: 'Session' as const, id: session.id })),
      ],
    }),

    createSession: builder.mutation<ChatSession, void>({
      query: () => ({ url: '/auth/session', method: 'POST' }),
      transformResponse: (response: unknown): ChatSession =>
        toChatSession(sessionResponseSchema.parse(response)),
      invalidatesTags: [{ type: 'Session', id: 'LIST' }],
    }),

    renameSession: builder.mutation<ChatSession, RenameSessionArgs>({
      query: ({ sessionId, sessionToken, name }) => ({
        url: `/auth/session/${encodeURIComponent(sessionId)}/name`,
        method: 'PATCH',
        body: new URLSearchParams({ name }),
        ...withSessionToken(sessionToken),
      }),
      extraOptions: { authScope: 'session' },
      transformResponse: (response: unknown): ChatSession =>
        toChatSession(sessionResponseSchema.parse(response)),

      // Renaming is instant in the UI and rolls back if the API disagrees.
      onQueryStarted: async ({ sessionId, name }, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          sessionsApi.util.updateQueryData('listSessions', undefined, (draft) => {
            const session = draft.find((candidate) => candidate.id === sessionId)
            if (session) session.name = name
          }),
        )

        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
    }),

    deleteSession: builder.mutation<void, DeleteSessionArgs>({
      query: ({ sessionId, sessionToken }) => ({
        url: `/auth/session/${encodeURIComponent(sessionId)}`,
        method: 'DELETE',
        ...withSessionToken(sessionToken),
      }),
      extraOptions: { authScope: 'session' },
      invalidatesTags: (_result, _error, { sessionId }) => [
        { type: 'Session', id: 'LIST' },
        { type: 'Messages', id: sessionId },
      ],
    }),
  }),
})

export const {
  useListSessionsQuery,
  useCreateSessionMutation,
  useRenameSessionMutation,
  useDeleteSessionMutation,
} = sessionsApi
