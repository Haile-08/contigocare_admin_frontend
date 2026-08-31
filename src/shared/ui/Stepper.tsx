import { Fragment } from 'react'

import { cn } from '@/shared/lib/cn'

import { Icon } from './Icon'

export interface Step {
  /** Stable key, also used as the accessible id. */
  id: string
  label: string
  /** One short line under the label. Optional — the labels carry the meaning. */
  hint?: string
}

/**
 * The wizard's progress indicator.
 *
 * It reports position, it does not offer navigation. Each step of the analysis
 * consumes the one before it — you cannot redact a document that has not been
 * extracted, and you cannot review a result that has not been produced — so a
 * clickable step would either be dead or would silently discard work. Going
 * back is a deliberate action on the step itself, not a click on a diagram.
 *
 * The completed marker is a check rather than the step number: at a glance the
 * difference between "step 2" and "step 2 is done" should not require reading.
 */
export function Stepper({
  steps,
  current,
  className,
}: {
  steps: Step[]
  /** Zero-based index of the step in progress. */
  current: number
  className?: string
}) {
  return (
    <ol
      className={cn('flex items-start gap-2', className)}
      aria-label={steps[current]?.label}
    >
      {steps.map((step, index) => {
        const done = index < current
        const active = index === current

        return (
          <Fragment key={step.id}>
            {index > 0 ? (
              // The connector carries the progress too, so the eye can read the
              // state from the line alone without parsing three markers.
              <li
                aria-hidden="true"
                className={cn(
                  'mt-3 h-px min-w-4 flex-1 transition-colors duration-200',
                  done || active ? 'bg-ink/40' : 'bg-line',
                )}
              />
            ) : null}

            <li
              aria-current={active ? 'step' : undefined}
              className="flex min-w-0 shrink-0 items-center gap-2"
            >
              <span
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-medium',
                  'transition-colors duration-200',
                  done
                    ? 'bg-ink/10 text-ink'
                    : active
                      ? 'bg-ink text-on-ink'
                      : 'border border-line-strong text-faint',
                )}
              >
                {done ? <Icon name="check" className="size-3" strokeWidth={2.2} /> : index + 1}
              </span>

              <span className="flex min-w-0 flex-col">
                <span
                  className={cn(
                    'truncate text-[12px] leading-tight transition-colors duration-200',
                    active ? 'font-medium text-body' : done ? 'text-muted' : 'text-faint',
                  )}
                >
                  {step.label}
                </span>
                {step.hint ? (
                  <span className="hidden truncate text-[10.5px] text-faint sm:block">
                    {step.hint}
                  </span>
                ) : null}
              </span>
            </li>
          </Fragment>
        )
      })}
    </ol>
  )
}
