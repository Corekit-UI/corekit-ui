import { cva } from 'class-variance-authority'
import { classNames } from '@corekit/ui/utils'

/**
 * Geometry of a column.
 *
 * Declared by the column, so that it stands on its own, and by the selector
 * as well, which draws the band across all of its columns at once and needs
 * the same numbers to place it.
 */
export const timeListVariables = [
  '[--ck-time-option-height:--spacing(8)]',
  // Options visible at once, the picked one and an even number around it.
  '[--ck-time-visible-options:5]',
  '[--ck-time-list-height:calc(var(--ck-time-option-height)*var(--ck-time-visible-options))]',
  // Room above the first option and below the last one, so that either can
  // come to rest in the middle of the column.
  '[--ck-time-list-padding:calc((var(--ck-time-list-height)_-_var(--ck-time-option-height))/2)]',
]

// The focus ring belongs to the host rather than to the scroller: masking an
// element clips everything it paints, an outline included.
export const timeListStyles = classNames(
  timeListVariables,
  'block',
  'rounded-md',
  'has-[:focus-visible]:outline-2',
  'has-[:focus-visible]:outline-offset-0',
  'outline-foreground/30',
)

// The padding is what lets the outermost options reach the middle, so it
// takes the place of the spacers a listbox has no room for.
export const timeListScrollerStyles = classNames(
  'block',
  'h-(--ck-time-list-height)',
  'snap-y',
  'snap-mandatory',
  'overflow-y-auto',
  'overscroll-contain',
  'py-(--ck-time-list-padding)',
  'rounded-md',
  'outline-none',
  // The column is scrolled by dragging and by the keyboard, so its scrollbar
  // is noise between the columns.
  '[scrollbar-width:none]',
  '[&::-webkit-scrollbar]:hidden',
  // Options fade out towards the ends of the column, so that the eye is left
  // with the middle, which is the only place a value is read from. Masking
  // rather than overlaying keeps it working on any background.
  '[mask-image:linear-gradient(to_bottom,transparent,black_var(--ck-time-option-height),black_calc(100%_-_var(--ck-time-option-height)),transparent)]',
)

export const timeListOptionStyles = cva(
  [
    'flex',
    'h-(--ck-time-option-height)',
    'cursor-pointer',
    'snap-center',
    'items-center',
    'justify-center',
    'rounded-md',
    'text-sm',
    'transition-colors',
    'select-none',
  ],
  {
    variants: {
      selected: {
        true: 'font-medium text-foreground',
        false: 'text-muted-foreground hover:text-foreground',
      },
    },
    defaultVariants: { selected: false },
  },
)
