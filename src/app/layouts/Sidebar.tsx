import { NavLink } from 'react-router-dom'

import { useAppSelector } from '@/app/store/hooks'
import { selectSidebarCollapsed } from '@/features/ui/model/uiSlice'
import { NAVIGATION } from '@/shared/config/navigation'
import { env } from '@/shared/config/env'
import { useTranslation } from '@/shared/i18n'
import { cn } from '@/shared/lib/cn'
import { BrandMark } from '@/shared/ui/BrandMark'
import { Icon } from '@/shared/ui/Icon'

/**
 * Primary navigation — the design's icon rail.
 *
 * Collapsed, the rail is 60 px of icons only, so `title` carries the label the
 * eye no longer gets. Groups are separated by a rule rather than a heading —
 * a handful of destinations don't need headings.
 *
 * The rail is destinations only. Starting an analysis is an action, not a
 * place, so it lives on the screens where it belongs — the dashboard and the
 * policy list — and opens the wizard in a drawer from there.
 */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const collapsed = useAppSelector(selectSidebarCollapsed)
  const { t } = useTranslation()

  return (
    <nav
      aria-label={t('nav.main')}
      className={cn(
        'flex h-full flex-col justify-between overflow-hidden border-r border-line bg-canvas py-4',
        collapsed ? 'w-sidebar-collapsed px-3' : 'w-sidebar px-3',
      )}
    >
      <div className="flex flex-col gap-1.5">
        <div
          className={cn(
            'mb-4 flex h-7.5 items-center gap-2.5 text-body',
            // Collapsed, the mark takes the same 34 px box as a nav icon, so
            // the rail reads as one centred column rather than a logo set
            // slightly to the left of everything under it.
            collapsed ? 'w-8.5 justify-center' : 'px-1',
          )}
        >
          <BrandMark className="h-7" {...(collapsed ? { label: env.appName } : {})} />
          {collapsed ? null : (
            <span className="truncate text-[13.5px] font-medium tracking-[-0.01em]">
              karai.health
            </span>
          )}
        </div>

        {NAVIGATION.map((group, index) => (
          <div
            key={group.labelKey}
            className={cn('flex flex-col gap-1.5', index > 0 && 'mt-1.5 border-t border-line pt-3')}
          >
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                title={t(item.labelKey)}
                className={({ isActive }) =>
                  cn(
                    'flex h-8.5 items-center gap-2.5 rounded-[9px] transition-colors',
                    collapsed ? 'w-8.5 justify-center px-0' : 'w-full justify-start px-2',
                    isActive
                      ? 'bg-ink text-on-ink'
                      : 'text-muted hover:bg-surface-sunk hover:text-body',
                  )
                }
              >
                <Icon name={item.icon} className="size-4.25" />
                {collapsed ? null : (
                  <span className="truncate text-[12.5px]">{t(item.labelKey)}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      <div
        title={env.appName}
        className={cn(
          'flex h-8.5 items-center gap-2 rounded-[9px] text-faint',
          collapsed ? 'w-8.5 justify-center px-0' : 'px-2',
        )}
      >
        <Icon name="info" className="size-4.25" />
        {collapsed ? null : <span className="truncate text-[11.5px]">{env.appName}</span>}
      </div>
    </nav>
  )
}
