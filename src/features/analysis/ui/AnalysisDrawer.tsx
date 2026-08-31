import { Suspense, lazy } from 'react'
import { useNavigate } from 'react-router-dom'

import { paths } from '@/app/router/paths'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { analysisDrawerToggled, selectAnalysisDrawerOpen } from '@/features/ui/model/uiSlice'
import { useTranslation } from '@/shared/i18n'
import { Drawer } from '@/shared/ui/Drawer'
import { Spinner } from '@/shared/ui/Spinner'

// The wizard pulls in the redaction reviewer, the largest component in the app.
// It stays out of the shell's bundle and is fetched the first time someone
// actually opens the drawer — the same deal the route used to get from `lazy`.
const AnalysisWizard = lazy(async () => import('./AnalysisWizard'))

/**
 * The analysis wizard, mounted beside the console instead of in place of it.
 *
 * This lives in the app shell rather than on a route, so starting an analysis
 * from the dashboard leaves the dashboard exactly where it was — same scroll,
 * same queries, no chunk swap on the way out. The drawer is only *mounted*
 * while it is open, which is also what guarantees the extracted document is
 * gone the moment it closes.
 */
export function AnalysisDrawer() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const open = useAppSelector(selectAnalysisDrawerOpen)
  const { t } = useTranslation()

  const close = (): void => {
    dispatch(analysisDrawerToggled(false))
  }

  return (
    <Drawer
      open={open}
      title={t('wizard.title')}
      description={t('wizard.description')}
      onClose={close}
    >
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center py-24 text-muted">
            <Spinner className="size-5" />
          </div>
        }
      >
        <AnalysisWizard
          onClose={close}
          onSaved={(analysisId) => {
            // The run is stored; the drawer's job is done. Close first so the
            // document state is dropped before the detail screen mounts.
            close()
            navigate(paths.policy(analysisId))
          }}
        />
      </Suspense>
    </Drawer>
  )
}
