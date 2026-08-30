import { Spinner } from './Spinner'

export function FullPageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface text-muted">
      {/* No label passed through means the spinner announces its own, in the
          user's language. */}
      <Spinner className="size-6" {...(label === undefined ? {} : { label })} />
    </div>
  )
}
