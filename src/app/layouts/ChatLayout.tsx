import { Outlet } from 'react-router-dom'

import { SessionSidebar } from '@/features/sessions/ui/SessionSidebar'

/**
 * The chat screen's own two-column split, inside the app shell.
 *
 * The conversation list belongs to this section, not to the console: it is
 * one screen's navigation, so it lives beside that screen rather than in the
 * global rail, which stays a list of sections.
 */
export function ChatLayout() {
  return (
    <div className="flex h-full min-h-0">
      <SessionSidebar />
      <Outlet />
    </div>
  )
}
