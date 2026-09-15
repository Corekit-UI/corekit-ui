import { cva } from 'class-variance-authority'
import { classNames } from '@corekit/ui/utils'
import { timeListVariables } from './time-list.styles'

export const timeSelectorStyles = classNames(
  timeListVariables,
  '[--ck-time-header-height:--spacing(6)]',
  'relative',
  'flex',
  'items-stretch',
  'gap-1',
)

/**
 * Band marking where the picked options come to rest, drawn across every
 * column at once the way the wheels of a clock share one line.
 *
 * It starts below the headers and is pushed down by the room the columns keep
 * above their first option, which lands it exactly on an option at rest.
 */
export const timeSelectorBandStyles = classNames(
  'pointer-events-none',
  'absolute',
  'inset-x-0',
  'top-[calc(var(--ck-time-header-height)_+_var(--ck-time-list-padding))]',
  'h-(--ck-time-option-height)',
  'rounded-md',
  'bg-muted',
)

// Positioned, so that the columns paint over the band instead of under it:
// an absolute band beats a static column no matter the order in the DOM.
export const timeSelectorColumnStyles = cva(['relative', 'flex', 'flex-col'], {
  variants: {
    content: {
      digits: 'w-12',
      // The names of the day periods run longer than two digits, e.g. `午前`.
      dayPeriod: 'w-16',
    },
  },
  defaultVariants: { content: 'digits' },
})

export const timeSelectorHeaderStyles = classNames(
  'flex',
  'h-(--ck-time-header-height)',
  'items-center',
  'justify-center',
  'text-[0.8rem]',
  'font-normal',
  'text-muted-foreground',
  'select-none',
)

// Pushed down by the height of a header, so that the separator lines up with
// the middle of the columns instead of the middle of the whole selector.
export const timeSelectorSeparatorColumnStyles = classNames(
  'relative',
  'flex',
  'w-3',
  'flex-col',
  'pt-(--ck-time-header-height)',
)

export const timeSelectorSeparatorStyles = classNames(
  'flex',
  'flex-1',
  'items-center',
  'justify-center',
  'text-sm',
  'text-muted-foreground',
  'select-none',
)
