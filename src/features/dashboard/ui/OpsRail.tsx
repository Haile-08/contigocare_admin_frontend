import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { paths } from '@/app/router/paths'
import { useAppDispatch } from '@/app/store/hooks'
import { opsRailToggled } from '@/features/ui/model/uiSlice'
import { useTranslation } from '@/shared/i18n'
import { Badge } from '@/shared/ui/Badge'
import { Icon } from '@/shared/ui/Icon'
import { Skeleton } from '@/shared/ui/Skeleton'

import type { Overview } from '../api/metricsApi'
import { MessageMix } from './MessageMix'

/**
 * The dashboard's right-hand rail — what needs a person today.
 *
 * The main column answers "how much is happening"; this one answers "what
 * should I open". They are different questions with different rhythms, which is
 * why the design gives the second one its own full-height column with its own
 * scroll rather than a fourth card at the bottom of the first.
 *
 * It reads the same cache entry as the page rather than issuing its own
 * requests: the overview is one expensive query, and two subscribers to it cost
 * nothing extra.
 */

function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: { to: string; label: string }
  children: ReactNode
}) {
  return (
    <section className="border-b border-line px-4 py-4 last:border-b-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-[12.5px] font-medium text-body">{title}</h3>
        {action ? (
          <Link
            to={action.to}
            className="flex items-center gap-1.5 text-[11px] text-muted transition-colors hover:text-body"
          >
            {action.label}
            <Icon name="arrowRight" className="size-3" strokeWidth={1.8} />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function Rows({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2.5">{children}</div>
}

function RowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Rows>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-9 rounded-sm" />
      ))}
    </Rows>
  )
}

export function OpsRail({
  overview,
  isLoading,
}: {
  overview: Overview | undefined
  isLoading: boolean
}) {
  const dispatch = useAppDispatch()
  const { t, fmt } = useTranslation()

  const waiting = (overview?.rows ?? []).filter((row) => row.previewRole === 'user').slice(0, 4)
  const unstarted = (overview?.rows ?? []).filter(
    (row) => !row.unavailable && row.messages === 0,
  ).slice(0, 4)

  return (
    <aside
      aria-label={t('opsRail.label')}
      className="flex h-full min-h-0 w-rail flex-col border-l border-line bg-canvas"
    >
      <div className="flex h-12.5 shrink-0 items-center justify-between border-b border-line pr-3 pl-4">
        <div className="flex items-center gap-2.25">
          <Icon name="spark" className="size-4 text-ink" />
          <h2 className="text-[13.5px] font-medium text-body">{t('opsRail.label')}</h2>
        </div>
        <button
          type="button"
          onClick={() => dispatch(opsRailToggled(false))}
          aria-label={t('opsRail.hidePanel')}
          className="grid size-7 place-items-center rounded-[7px] text-muted transition-colors hover:bg-surface-sunk hover:text-body"
        >
          <Icon name="close" className="size-3.5" strokeWidth={1.9} />
        </button>
      </div>

      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto">
        {/*
          Threads whose last turn was the person's lead the rail: they are the
          only thing here that ended without an answer.
        */}
        <Section title={t('opsRail.waiting')} action={{ to: paths.chat, label: t('common.all') }}>
          {isLoading ? (
            <RowSkeleton />
          ) : waiting.length > 0 ? (
            <Rows>
              {waiting.map((row) => (
                <Link
                  key={row.id}
                  to={paths.chatSession(row.id)}
                  className="flex items-center justify-between gap-3 rounded-sm border border-line-soft bg-surface px-2.75 py-2.25 transition-colors hover:border-line-strong"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] text-body">
                      {row.name || t('sessions.untitled')}
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-[10.5px] text-faint">
                      {t('opsRail.messageCount', { count: row.messages })}
                    </span>
                  </span>
                  <Badge tone="neutral">{t('common.open')}</Badge>
                </Link>
              ))}
            </Rows>
          ) : (
            <p className="text-[11.5px] text-muted">
              {t('opsRail.waitingEmpty')}
            </p>
          )}
        </Section>

        <Section
          title={t('opsRail.unstarted')}
          action={{ to: paths.chat, label: t('common.all') }}
        >
          {isLoading ? (
            <RowSkeleton count={2} />
          ) : unstarted.length > 0 ? (
            <Rows>
              {unstarted.map((row) => (
                <Link
                  key={row.id}
                  to={paths.chatSession(row.id)}
                  className="flex items-center justify-between gap-3 rounded-sm border border-line-soft bg-surface px-2.75 py-2.25 transition-colors hover:border-line-strong"
                >
                  <span className="min-w-0 truncate text-[12px] text-body">
                    {row.name || t('sessions.untitled')}
                  </span>
                  <Badge tone="warning">{t('opsRail.badgeEmpty')}</Badge>
                </Link>
              ))}
            </Rows>
          ) : (
            <p className="text-[11.5px] text-muted">{t('opsRail.unstartedEmpty')}</p>
          )}
        </Section>

        <Section title={t('opsRail.messageMix')}>
          <MessageMix overview={overview} isLoading={isLoading} />
        </Section>

        <Section title={t('opsRail.method')}>
          <p className="text-[11.5px] leading-relaxed text-muted">{t('opsRail.methodBody')}</p>
          {overview?.partial ? (
            <p className="mt-2 text-[10.5px] text-faint">
              {t('opsRail.methodPartial', {
                sampled: fmt.number(overview.sampled),
                total: fmt.number(overview.conversations),
              })}
            </p>
          ) : null}
        </Section>
      </div>
    </aside>
  )
}
