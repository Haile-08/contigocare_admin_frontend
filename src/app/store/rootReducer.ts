import { combineSlices } from '@reduxjs/toolkit'

import { authSlice } from '@/features/auth/model/authSlice'
import { chatSlice } from '@/features/chat/model/chatSlice'
import { uiSlice } from '@/features/ui/model/uiSlice'
import { baseApi } from '@/shared/api/baseApi'

/**
 * `combineSlices` mounts each slice under its own `name`, so adding a feature
 * means adding it here and nowhere else — no string keys to keep in sync.
 */
export const rootReducer = combineSlices(authSlice, chatSlice, uiSlice, baseApi)

export type RootState = ReturnType<typeof rootReducer>
