import { ElementRef, Signal } from '@angular/core'

/**
 * Control of a popup showing a calendar, which can turn down arbitrary days
 * on top of the boundaries every control has.
 */
export type CkCalendarDatepickerControl<D> = CkDatepickerControl<D> & {
  /** Function disabling arbitrary dates, e.g. weekends. */
  dateFilter: Signal<((date: D) => boolean) | null>
}

/**
 * Control a datepicker popup is attached to — a single input or, for a date
 * range, a group of them.
 *
 * This is all the popup knows about its control: the boundaries, which belong
 * to the control as they also drive its validation, the element the popup is
 * anchored to, and the date it opens at.
 */
export type CkDatepickerControl<D> = {
  /** The minimum selectable date. */
  min: Signal<D | null>

  /** The maximum selectable date. */
  max: Signal<D | null>

  /** Whether the control is disabled. */
  isDisabled: Signal<boolean>

  /**
   * Element the popup is anchored to. Not necessarily the control's own
   * element — an input inside a form field can anchor the popup to the whole
   * field instead.
   */
  getConnectedOverlayOrigin(): ElementRef<HTMLElement>

  /**
   * The date the popup opens at, e.g. the selected date or the start of the
   * selected range.
   */
  getStartValue(): D | null

  /**
   * Moves the focus into the control, e.g. once the popup is closed and the
   * element that opened it is gone.
   */
  focus(): void
}
