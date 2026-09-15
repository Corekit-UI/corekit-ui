import { classNames } from '@corekit/ui/utils'

export const calendarStyles = classNames(
  '[--ck-cell-size:--spacing(8)]',
  // Space a day cell takes in the month grid, its own size plus the space
  // separating it from the next one.
  '[--ck-cell-pitch:calc(var(--ck-cell-size)_+_var(--spacing))]',
  // Width of the views' content: 7 day cells and 6 gaps between them. Keeps
  // the calendar width stable when switching between views.
  '[--ck-calendar-width:calc(7_*_var(--ck-cell-size)_+_6_*_var(--spacing))]',
  'block',
  'w-fit',
  'space-y-3',
  'rounded-lg',
  'border',
  'bg-surface',
  'p-3',
  'text-surface-foreground',
  'shadow-md',
)
