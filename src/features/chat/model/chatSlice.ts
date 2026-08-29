import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

import { unauthorizedDetected } from '@/shared/api/authEvents'

/**
 * Client-only chat state.
 *
 * Server data (messages, sessions) lives in the RTK Query cache, and the
 * *selected* session lives in the URL. What remains is genuinely local: unsent
 * composer text, kept per session so switching conversations does not throw
 * away what someone was typing.
 */
export interface ChatState {
  drafts: Record<string, string>
}

const initialState: ChatState = { drafts: {} }

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    draftChanged: (state, action: PayloadAction<{ sessionId: string; text: string }>) => {
      state.drafts[action.payload.sessionId] = action.payload.text
    },
    draftCleared: (state, action: PayloadAction<string>) => {
      delete state.drafts[action.payload]
    },
  },

  extraReducers: (builder) => {
    // A rejected session token means that conversation is gone; drop its draft.
    builder.addCase(unauthorizedDetected, (state, action) =>
      action.payload.scope === 'session' ? initialState : state,
    )
  },

  selectors: {
    selectDraft: (state, sessionId: string): string => state.drafts[sessionId] ?? '',
  },
})

export const { draftChanged, draftCleared } = chatSlice.actions
export const { selectDraft } = chatSlice.selectors
