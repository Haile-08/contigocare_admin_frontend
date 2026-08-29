import { z } from 'zod'

/** Mirrors the backend's `Message` schema constraint. */
export const MAX_MESSAGE_LENGTH = 3000

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
})

export const chatResponseSchema = z.object({
  request_id: z.string().optional(),
  messages: z.array(chatMessageSchema),
})

/** One `data:` frame of the SSE stream. */
export const streamChunkSchema = z.object({
  content: z.string(),
  done: z.boolean(),
})

export type ChatMessage = z.infer<typeof chatMessageSchema>
export type ChatRole = ChatMessage['role']

export interface SessionScopedArgs {
  sessionId: string
  sessionToken: string
}

export interface SendMessageArgs extends SessionScopedArgs {
  /**
   * The *new* messages only — normally a single user turn.
   *
   * The backend graph keeps the conversation checkpointed per session and
   * appends whatever it is sent, so replaying the whole history here would
   * duplicate every earlier turn.
   */
  messages: ChatMessage[]
}
