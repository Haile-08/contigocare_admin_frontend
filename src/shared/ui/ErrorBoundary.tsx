import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

import { logger } from '@/shared/lib/logger'

import { Button } from './Button'

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

    return (
      <div className="flex min-h-40 flex-col items-center justify-center gap-3 p-8 text-center">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Something went wrong</h2>
          <p className="mt-1 text-sm text-slate-600">
            The page hit an unexpected error. You can try again.
          </p>
        </div>
        <Button variant="secondary" onClick={this.reset}>
          Try again
        </Button>
      </div>
    )
  }
}
