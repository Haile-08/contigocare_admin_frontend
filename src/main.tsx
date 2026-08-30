import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@/app/App'
import { store } from '@/app/store'
import { applyLocale, applyTheme } from '@/features/ui/model/uiListeners'

import './index.css'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Missing #root element — check index.html')
}

// Before the first paint, so a user who chose dark mode never sees a white
// flash on reload, and `<html lang>` is right for the very first screen read.
// Every later change goes through the ui listener.
applyTheme(store.getState().ui.theme)
applyLocale(store.getState().ui.locale)

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
