import { cva } from 'class-variance-authority'
import { classNames } from '@corekit/ui/utils'

export const calendarViewTableStyles = classNames(
  'w-(--ck-calendar-width)',
  'border-collapse',
)

export const calendarViewRowStyles = classNames('flex', 'gap-1')

export const calendarViewCellContainerStyles = classNames(
  'mt-1',
  'flex-1',
  'p-0',
)

/** Cell button stretched to its container, e.g. a month or a year. */
export const calendarViewFullWidthCellStyles = classNames(
  'h-(--ck-cell-size)',
  'w-full',
)

/**
 * Styles of a selectable grid cell button shared by the calendar views.
 * Sizing is up to each view.
 */
export const calendarViewCellStyles = cva(
  [
    'flex',
    'items-center',
    'justify-center',
    'rounded-md',
    'text-sm',
    'font-normal',
    'transition-colors',
    'select-none',
    'hover:bg-muted',
    'hover:text-foreground',
    'focus-visible:outline-2',
    'focus-visible:outline-offset-0',
    'outline-foreground/30',
  ],
  {
    variants: {
      state: {
        default: null,
        today: 'bg-muted',
        selected: [
          'bg-primary',
          'text-primary-foreground',
          'hover:bg-primary',
          'hover:text-primary-foreground',
        ],
      },
      disabled: {
        true: ['pointer-events-none', 'opacity-50'],
        false: null,
      },
    },
    defaultVariants: { state: 'default', disabled: false },
  },
)

/**
 * Band highlighting the days a range spans.
 *
 * Drawn by a pseudo element of the cell rather than by its background: it has
 * to run through the space between the cells to read as one strip, and at the
 * ends of the range it has to stop exactly where the day's own background
 * begins, instead of peeking out from under it.
 */
export const calendarViewRangeStyles = cva(
  [
    'relative',
    'before:absolute',
    'before:content-[""]',
    'before:inset-y-0',
    'before:start-0',
    'before:end-0',
    'before:transition-colors',
  ],
  {
    variants: {
      /** Whether the day falls between the two ends of the selected range. */
      inRange: { true: 'before:bg-primary/10', false: null },

      /** Whether the day opens the selected range. */
      rangeStart: { true: 'before:start-0.5 before:rounded-s-md', false: null },

      /** Whether the day closes the selected range. */
      rangeEnd: { true: 'before:end-0.5 before:rounded-e-md', false: null },

      /**
       * Whether the day falls into the range being previewed — the one that
       * would be selected if the user picked the day they are pointing at.
       */
      inPreview: { true: 'before:bg-muted', false: null },

      /** Whether the day opens the previewed range. */
      previewStart: {
        true: 'before:start-0.5 before:rounded-s-md',
        false: null,
      },

      /** Whether the day closes the previewed range. */
      previewEnd: { true: 'before:end-0.5 before:rounded-e-md', false: null },
    },
    defaultVariants: {
      inRange: false,
      rangeStart: false,
      rangeEnd: false,
      inPreview: false,
      previewStart: false,
      previewEnd: false,
    },
  },
)
