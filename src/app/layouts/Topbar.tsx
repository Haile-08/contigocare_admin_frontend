import { useEffect, useRef, useState } from 'react'

import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { useLogoutMutation } from '@/features/auth/api/authApi'
import { selectAdmin } from '@/features/auth/model/authSlice'
import {
  mobileNavToggled,
  selectSidebarCollapsed,
  selectTheme,
  sidebarToggled,
  themeToggled,
} from '@/features/ui/model/uiSlice'
import { LanguageSelect } from '@/features/ui/ui/LanguageSelect'
import { useTranslation } from '@/shared/i18n'
import { cn } from '@/shared/lib/cn'
import { initials } from '@/shared/lib/format'
import { Icon } from '@/shared/ui/Icon'

import { Breadcrumbs } from './Breadcrumbs'

/** The header's icon buttons — 34 px, 9 px radius, quiet until hovered. */
const ICON_BUTTON =
  'grid size-8.5 place-items-center rounded-[9px] text-muted transition-colors hover:bg-surface-sunk hover:text-body'

export function Topbar() {
  const dispatch = useAppDispatch()
  const admin = useAppSelector(selectAdmin)
  const theme = useAppSelector(selectTheme)
  const collapsed = useAppSelector(selectSidebarCollapsed)
  const { t } = useTranslation()

  // Signing out is a server-side action: it revokes the whole refresh-token
  // family and clears the HttpOnly cookie. Clearing local state alone would
  // leave a live cookie that could mint a new session on the next reload.
  const [logout] = useLogoutMutation()

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Dismiss the account menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return

    const onPointerDown = (event: PointerEvent): void => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const name = admin?.fullName || admin?.email || null

  return (
    <header className="flex h-topbar shrink-0 items-center gap-2.5 border-b border-line bg-surface pr-3 pl-3.5">
      <button
        type="button"
        onClick={() => dispatch(mobileNavToggled())}
        aria-label={t('topbar.openNavigation')}
        className={cn(ICON_BUTTON, '-ml-1 lg:hidden')}
      >
        <Icon name="menu" className="size-4.25" />
      </button>

      {/*
       * The rail's collapse control lives here rather than in the rail itself:
       * at 60 px wide the rail has no room for a labelled control, and the
       * design puts it against the header's left edge.
       */}
      <button
        type="button"
        onClick={() => dispatch(sidebarToggled())}
        aria-label={collapsed ? t('topbar.expandSidebar') : t('topbar.collapseSidebar')}
        aria-pressed={!collapsed}
        className={cn(ICON_BUTTON, '-ml-1 hidden text-body lg:grid')}
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4.25"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M9 3v18" />
          <path d={collapsed ? 'M13 9l2.5 3-2.5 3' : 'M16 9l-2.5 3 2.5 3'} />
        </svg>
      </button>

      <Breadcrumbs />

      <div className="ml-auto flex items-center gap-1">
        {/* Language sits beside the theme toggle: both are preferences about
            how the console is presented, not about what it is showing. */}
        <LanguageSelect className="mr-1" />

        <button
          type="button"
          onClick={() => dispatch(themeToggled())}
          aria-label={theme === 'light' ? t('topbar.switchToDark') : t('topbar.switchToLight')}
          className={ICON_BUTTON}
        >
          <Icon name={theme === 'light' ? 'moon' : 'sun'} className="size-4.25" />
        </button>

        <div aria-hidden="true" className="mx-1.5 h-5.5 w-px bg-line" />

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setMenuOpen((open) => !open)
            }}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2.25 rounded-full py-1 pr-2.5 pl-1 transition-colors hover:bg-surface-sunk"
          >
            <span className="grid size-6.75 place-items-center rounded-full bg-brand-soft text-[11px] font-medium text-ink">
              {initials(admin?.fullName, admin?.email)}
            </span>
            <span className="hidden max-w-40 truncate text-[12.5px] text-mid sm:inline">
              {name ?? t('topbar.account')}
            </span>
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className={cn(
                'absolute right-0 z-30 mt-1.5 w-56 overflow-hidden rounded-sm',
                'border border-line-soft bg-surface-hi shadow-[0_8px_24px_rgba(0,0,0,0.08)]',
              )}
            >
              <div className="border-b border-line-faint px-3 py-2.5">
                <p className="truncate text-[12.5px] font-medium text-body">
                  {admin?.fullName || t('topbar.signedIn')}
                </p>
                <p className="truncate text-[11px] text-muted">{admin?.email}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  void logout()
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[12.5px] text-mid transition-colors hover:bg-surface-sunk hover:text-body"
              >
                <Icon name="logout" className="size-3.75" />
                {t('topbar.signOut')}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
