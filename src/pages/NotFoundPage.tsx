import { Link } from 'react-router-dom'

import { paths } from '@/app/router/paths'
import { useTranslation } from '@/shared/i18n'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <main className="flex min-h-dvh bg-surface flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="font-mono text-[12px] text-faint">404</p>
      <h1 className="text-[17px] font-medium tracking-[-0.015em] text-body">
        {t('error.pageNotFound')}
      </h1>
      <Link to={paths.root} className="mt-2 text-[12.5px] text-ink hover:underline">
        {t('error.goHome')}
      </Link>
    </main>
  )
}

export default NotFoundPage
