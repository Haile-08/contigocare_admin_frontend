import { Link } from 'react-router-dom'

import { paths } from '@/app/router/paths'
import { useTranslation } from '@/shared/i18n'
import { Badge } from '@/shared/ui/Badge'
import { Icon } from '@/shared/ui/Icon'
import { Skeleton } from '@/shared/ui/Skeleton'

import type { ConversationMetric } from '../api/metricsApi'

/**
 * The busiest conversations, as an activity list.
 *
 * A table would be the obvious choice and the wrong one: this is a feed, read
 * top to bottom for "what has been happening", not scanned column-wise for
 * comparison. So each row is one link with a two-line identity, a state pill
 * and the count.
 */
export function RecentConversations({
  rows,
  isLoading,
}: {
  rows: ConversationMetric[] | undefined
  isLoading: boolean
}) {
  const { t, fmt } = useTranslation()

  if (isLoading) {
    return (
      <div className="flex flex-col">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-3.5 border-t border-line-faint px-4.5 py-3.25"
          >
            <Skeleton className="size-8.5 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="mt-2 h-2.5 w-56" />
            </div>
            <Skeleton className="h-4 w-16 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  if (!rows?.length) {
    return (
      <p className="border-t border-line-faint py-10 text-center text-[11.5px] text-muted">
        {t('dashboard.busiestEmpty')}
      </p>
    )
  }

  return (
    <ul>
      {rows.map((row) => (
        <li key={row.id}>
          <Link
            to={paths.chatSession(row.id)}
            className="grid grid-cols-[2.125rem_minmax(0,1fr)_auto] items-center gap-3.5 border-t border-line-faint px-4.5 py-3.25 transition-colors hover:bg-canvas"
          >
            <span className="grid size-8.5 place-items-center rounded-full border border-line text-muted">
              <Icon name={row.messages > 0 ? 'message' : 'plus'} className="size-3.75" />
            </span>

            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium tracking-[-0.005em] text-body">
                {row.name || t('sessions.untitled')}
              </span>
              <span className="mt-0.75 block truncate text-[11.5px] text-muted">
                {row.unavailable
                  ? t('dashboard.row.unavailable')
                  : (row.preview ?? t('dashboard.row.noMessages'))}
              </span>
            </span>

            <span className="flex items-center gap-2.5">
              {row.previewRole ? (
                <Badge tone={row.previewRole === 'user' ? 'neutral' : 'brand'}>
                  {row.previewRole === 'user'
                    ? t('dashboard.row.awaitingReply')
                    : t('dashboard.row.answered')}
                </Badge>
              ) : null}
              <span className="tnum min-w-14 text-right font-mono text-[12px] text-body">
                {fmt.number(row.messages)}
                <span className="ml-1 text-faint">{t('dashboard.row.messageAbbrev')}</span>
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
