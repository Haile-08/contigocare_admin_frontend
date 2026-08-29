import { Spinner } from './Spinner'

export function FullPageSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center text-slate-400">
      <Spinner className="size-8" label={label} />
    </div>
  )
}
