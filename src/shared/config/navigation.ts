import { paths } from '@/app/router/paths'
import type { TranslationKey } from '@/shared/i18n'
import type { IconName } from '@/shared/ui/Icon'

export interface NavItem {
  to: string
  /** A translation key, not text — the rail is rendered in the user's language. */
  labelKey: TranslationKey
  icon: IconName
  /** Non-index routes match on prefix, so a detail page keeps its parent lit. */
  end?: boolean
}

export interface NavGroup {
  labelKey: TranslationKey
  items: NavItem[]
}

/**
 * The sidebar is data, not JSX.
 *
 * Adding a section means adding an entry here. The icon is a name from the
 * shared registry rather than inline SVG, so the rail can't acquire a glyph
 * drawn at a different weight from the rest of the app — and the label is a key
 * from the dictionary rather than a string, so it can't acquire English either.
 */
export const NAVIGATION: NavGroup[] = [
  {
    labelKey: 'nav.overview',
    items: [{ to: paths.dashboard, labelKey: 'nav.dashboard', icon: 'grid', end: true }],
  },
  {
    labelKey: 'nav.work',
    items: [{ to: paths.chat, labelKey: 'nav.conversations', icon: 'chat' }],
  },
]
