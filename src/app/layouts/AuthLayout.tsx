import type { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { selectTheme, themeToggled } from '@/features/ui/model/uiSlice'
import { LanguageSelect } from '@/features/ui/ui/LanguageSelect'
import { useTranslation } from '@/shared/i18n'
import type { TranslationKey } from '@/shared/i18n'
import { BrandMark } from '@/shared/ui/BrandMark'
import { Icon } from '@/shared/ui/Icon'

/**
 * The shell every signed-out screen renders into.
 *
 * Sign-in and registration are one flow, so they share one frame: the brand
 * panel never re-mounts as the user moves between them, and a screen added
 * later can't drift off the design by re-implementing the chrome.
 *
 * The brand panel is decorative context for the form, so it drops out below
 * `lg` rather than stacking above it — on a phone whoever is signing in wants
 * the fields, not the pitch.
 *
 * Language and theme are reachable *here*, not only from the signed-in topbar:
 * the first screen a Spanish speaker ever sees is this one, and asking them to
 * sign in before they can read the console is the wrong order.
 */

/** Deliberately not numbers: the console does not have a metric to boast yet. */
const CAPABILITIES: Array<{ title: TranslationKey; body: TranslationKey }> = [
  { title: 'auth.capability.redaction', body: 'auth.capability.redactionBody' },
  { title: 'auth.capability.evidence', body: 'auth.capability.evidenceBody' },
  { title: 'auth.capability.retention', body: 'auth.capability.retentionBody' },
]

const TOPICS: TranslationKey[] = [
  'auth.topic.gmm',
  'auth.topic.coverage',
  'auth.topic.waiting',
  'auth.topic.exclusions',
]

export function AuthLayout() {
  const dispatch = useAppDispatch()
  const theme = useAppSelector(selectTheme)
  const { t } = useTranslation()

  return (
    <main className="relative flex min-h-dvh w-full bg-surface-hi text-body">
      <aside className="hidden flex-[0_0_54%] flex-col justify-between gap-12 border-r border-line bg-canvas px-12 py-14 lg:flex">
        <div className="flex items-center gap-3">
          <BrandMark className="h-9" />
          <span className="text-[17px] font-medium tracking-[-0.015em]">ContigoCare</span>
        </div>

        <div className="flex max-w-140 flex-col gap-8.5">
          <div className="flex flex-col gap-4">
            <p className="text-[10px] tracking-[0.24em] text-faint uppercase">
              {t('auth.eyebrow')}
            </p>
            {/* The design marks this up as the page h1; each screen's own
                heading carries that role instead, so the page keeps exactly one
                h1 even when this panel is dropped on a small viewport. */}
            <p className="text-[44px] leading-[1.05] font-normal tracking-[-0.025em] text-pretty text-body">
              {t('auth.headlineLead')}
              <br />
              <span className="text-ink">{t('auth.headlineAccent')}</span>
            </p>
            <p className="max-w-105 text-[15px] leading-[1.6] text-pretty text-muted">
              {t('auth.intro')}
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-6 border-t border-line pt-6.5">
            {CAPABILITIES.map((capability) => (
              <div key={capability.title} className="flex flex-col gap-1.5">
                <dt className="flex items-center gap-2 text-[13px] font-medium text-body">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
                  {t(capability.title)}
                </dt>
                <dd className="text-xs leading-[1.45] text-muted">{t(capability.body)}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-col gap-3.5">
          <ul className="flex flex-wrap gap-2">
            {TOPICS.map((topic) => (
              <li
                key={topic}
                className="rounded-full border border-line-strong px-3.25 py-1.5 text-xs text-mid"
              >
                {t(topic)}
              </li>
            ))}
          </ul>
          <p className="text-[11px] tracking-[0.16em] text-faint uppercase">{t('auth.footer')}</p>
        </div>
      </aside>

      {/* Pinned to the corner rather than placed in the flow: these are settings
          for the page, not a step in signing in. */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
        <LanguageSelect />
        <button
          type="button"
          onClick={() => dispatch(themeToggled())}
          aria-label={theme === 'light' ? t('topbar.switchToDark') : t('topbar.switchToLight')}
          className="grid size-8.5 place-items-center rounded-[9px] text-muted transition-colors hover:bg-surface-sunk hover:text-body"
        >
          <Icon name={theme === 'light' ? 'moon' : 'sun'} className="size-4.25" />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center bg-surface-hi px-6 py-12 sm:px-14">
        <div className="flex w-full max-w-89 flex-col gap-6.5">
          <div className="flex items-center gap-2.5 lg:hidden">
            <BrandMark className="h-8" />
            <span className="text-[15px] font-medium tracking-[-0.01em]">ContigoCare</span>
          </div>
          <Outlet />
        </div>
      </div>
    </main>
  )
}

/** Heading pair shared by every auth screen. */
export function AuthHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-[26px] leading-tight font-normal tracking-[-0.02em] text-body">
        {title}
      </h1>
      {children ? <p className="text-sm leading-[1.5] text-muted">{children}</p> : null}
    </div>
  )
}
