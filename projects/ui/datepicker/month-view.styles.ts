import { classNames } from '@corekit/ui/utils'

export const monthViewStyles = classNames('block')

export const monthViewTableStyles = classNames('border-collapse')

// The space between the days lives inside the cells rather than in a row gap,
// so that the band of a selected range can run through it without breaking
// apart. The row pulls the outer halves of that space back, keeping the grid
// as wide as the other views.
export const monthViewWeekRowStyles = classNames('-mx-0.5', 'flex')

export const monthViewWeekdayStyles = classNames(
  'w-(--ck-cell-pitch)',
  'px-0.5',
  'text-center',
  'text-[0.8rem]',
  'font-normal',
  'text-muted-foreground',
  'select-none',
)

export const monthViewCellStyles = classNames(
  'mt-1',
  'w-(--ck-cell-pitch)',
  'px-0.5',
  'text-center',
)

// Positioned, so that the day paints over the band of the range it ends.
export const monthViewDayStyles = classNames(
  'relative',
  'size-(--ck-cell-size)',
)
