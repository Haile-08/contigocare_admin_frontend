import { cn } from '@/shared/lib/cn'

/**
 * Loading placeholder.
 *
 * Skeletons are sized to match the real content they replace — that's the whole
 * point. A skeleton with the wrong height produces a layout shift the moment
 * data arrives, which is worse than no skeleton at all.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('shimmer h-4 rounded-xs', className)} />
}
