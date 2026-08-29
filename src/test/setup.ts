import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Tests run without Vitest globals, so cleanup is wired explicitly.
afterEach(() => {
  cleanup()
  // Persisted credentials must not leak from one test into the next.
  globalThis.sessionStorage.clear()
})
