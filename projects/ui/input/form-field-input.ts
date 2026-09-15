import { InjectionToken } from '@angular/core'

/**
 * The element a form field treats as its input — a single control or a group
 * of them, e.g. the two halves of a date range.
 *
 * The form field only ever asks it to make room for the prefix and the suffix
 * projected next to it.
 */
export type CkFormFieldInput = {
  /** Reserves room at the start of the field for a prefix. */
  padStart(pad: boolean): void

  /** Reserves room at the end of the field for a suffix. */
  padEnd(pad: boolean): void
}

/**
 * Lets an element other than `[ckInput]` play the role of the input inside a
 * form field. Provide it with `useExisting` on a control that wants the form
 * field to treat it as one.
 */
export const CK_FORM_FIELD_INPUT = new InjectionToken<CkFormFieldInput>(
  'CK_FORM_FIELD_INPUT',
)
