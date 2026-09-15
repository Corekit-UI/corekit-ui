import { classNames } from '@corekit/ui/utils'

/**
 * Surface of the popup panel.
 *
 * The panel the datepicker base renders only carries the popup animations, so
 * the surface belongs to what is put inside it.
 */
export const timepickerPanelStyles = classNames(
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

export const timepickerFooterStyles = classNames(
  'flex',
  'items-center',
  'justify-end',
  'gap-2',
)
