import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

import { useTranslation } from '@/shared/i18n'
import { logger } from '@/shared/lib/logger'

import { Button } from './Button'

/**
 * The default panel, split out as a function component purely so it can use
 * the translation hook — a class component cannot.
 */
function DefaultFallback({ onReset }: { onReset: () => void }) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 p-8 text-center">
      <div>
        <h2 className="text-[15px] font-medium tracking-[-0.01em] text-body">
          {t('error.boundaryTitle')}
        </h2>
        <p className="mt-1 text-[12px] text-muted">{t('error.boundaryBody')}</p>
      </div>
      <Button variant="secondary" onClick={onReset}>
        {t('common.tryAgain')}
      </Button>
    </div>
  )
}

interface ErrorBoundaryProps {
  children: ReactNode
  /** Rendered instead of the default panel. Receives a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Catches render-time errors so one broken subtree does not blank the app.
 *
 * Still a class component: React has no hook equivalent. The message shown to
 * the user is deliberately generic — stack traces can carry ids, tokens, or
 * internal paths, so the detail goes to the logger instead.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('unhandled render error', {
      message: error.message,
      componentStack: info.componentStack,
    })
  }

  private readonly reset = (): void => {
    this.setState({ error: null })
  }

  override render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    if (this.props.fallback) return this.props.fallback(error, this.reset)

    return <DefaultFallback onReset={this.reset} />
  }
}
