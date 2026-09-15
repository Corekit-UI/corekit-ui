import { inputStyles } from '@corekit/ui/input'
import { classNames } from '@corekit/ui/utils'

/**
 * Frame around both halves of a range. Wears the styles of a regular input,
 * as together they read as one field.
 */
export function dateRangeInputStyles(
  variants: { padStart?: boolean; padEnd?: boolean; disabled?: boolean } = {},
): string {
  const { disabled, ...padding } = variants

  return classNames(
    inputStyles(padding),
    'flex',
    'items-center',
    'gap-1',
    // The frame belongs to the group rather than to an input, so the look a
    // single input gets from its own `:focus-visible` has to be driven by the
    // inputs inside it. The dimming of a disabled field comes from the
    // library reset, which the group opts into with `aria-disabled`.
    'has-[input:focus-visible]:outline-1',
    'has-[input:focus-visible]:outline-offset-0',
    'not-in-[.ck-invalid]:has-[input:focus-visible]:outline-primary',
    disabled && 'bg-muted shadow-none',
  )
}

/** Text between the two halves, e.g. a dash. */
export const dateRangeInputSeparatorStyles = classNames(
  'select-none',
  'text-muted-foreground',
)

/**
 * Type of the text inside the frame.
 *
 * A single input wears these through `inputStyles`; the halves are bare
 * inputs, so they have to wear them too — without a size of their own they
 * are at the mercy of whatever styles the text around the field, e.g. a
 * typography layer.
 */
const dateRangeInputTypeStyles = ['text-sm', 'pointer-coarse:max-lg:text-base']

/**
 * Box around a half of the range.
 *
 * An input has a width of its own, but here the start of the range has to sit
 * flush against the separator however much text it holds. The box is sized by
 * the mirror of the text inside it, and the input is stretched over the box.
 */
export const dateRangeInputWrapperStyles = classNames(
  'relative',
  'overflow-hidden',
  'max-w-[calc(50%_-_var(--spacing))]',
)

/** The end of the range takes whatever space the start has left. */
export const dateRangeInputEndWrapperStyles = classNames(
  dateRangeInputWrapperStyles,
  'grow',
)

/**
 * Copy of the text of a half, sizing the box around it. Both it and the input
 * take their type from the box around them, so the mirror always measures the
 * text the way the input renders it.
 */
export const dateRangeInputMirrorStyles = classNames(
  // Same type as the input it mirrors, or it measures the text in a size the
  // input doesn't render it in.
  ...dateRangeInputTypeStyles,
  'invisible',
  'inline-block',
  // Keeps the box from collapsing, with room for the caret.
  'min-w-[2px]',
  'whitespace-nowrap',
  'select-none',
)

/** Half of a range: a bare input, the frame around it belongs to the group. */
export const dateRangeInputPartStyles = classNames(
  ...dateRangeInputTypeStyles,
  'absolute',
  'inset-0',
  'size-full',
  'appearance-none',
  'bg-transparent',
  'p-0',
  'outline-none',
  'in-[.ck-invalid]:text-destructive',
  'in-[.ck-invalid]:placeholder:text-destructive/70',
)
