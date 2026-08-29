import { z } from 'zod'

import { tokenPayloadSchema } from '@/features/auth/model/types'

export const sessionResponseSchema = z.object({
  request_id: z.string().optional(),
  session_id: z.string(),
  name: z.string(),
  token: tokenPayloadSchema,
})

export const sessionListResponseSchema = z.array(sessionResponseSchema)

/**
 * A chat session plus the session-scoped token needed to act on it.
 *
 * The API mints a fresh token every time sessions are listed, so the token is
 * cache data rather than something worth persisting.
 */
export interface ChatSession {
  id: string
  name: string
  token: string
  tokenExpiresAt: string
}

export function toChatSession(response: z.infer<typeof sessionResponseSchema>): ChatSession {
  return {
    id: response.session_id,
    name: response.name,
    token: response.token.access_token,
    tokenExpiresAt: response.token.expires_at,
  }
}
