import { useDispatch, useSelector, useStore } from 'react-redux'

import type { AppStore } from './index'
import type { AppDispatch, RootState } from './types'

/**
 * Always use these instead of the bare react-redux hooks — they carry the
 * app's types, so selectors and thunks are checked at every call site.
 */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
export const useAppStore = useStore.withTypes<AppStore>()
