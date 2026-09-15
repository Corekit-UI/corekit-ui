import { InjectionToken } from '@angular/core'

/**
 * Formats used by date-aware components to parse and display dates.
 *
 * The shape of each format is defined by the `CkDateAdapter` implementation in
 * use, e.g. `Intl.DateTimeFormatOptions` for the `CkNativeDateAdapter`.
 */
export type CkDateFormats = {
  parse: {
    /** Format of the dates typed into an input. */
    dateInput: unknown

    /** Format of the times typed into an input. */
    timeInput: unknown
  }
  display: {
    /** Format of the date displayed in an input. */
    dateInput: unknown

    /** Format of the time displayed in an input. */
    timeInput: unknown

    /** Format of the month and year label in the calendar header. */
    monthYearLabel: unknown

    /** Accessible format of a full date announced by screen readers. */
    dateA11yLabel: unknown

    /** Accessible format of a month and year announced by screen readers. */
    monthYearA11yLabel: unknown
  }
}

/** InjectionToken for the date formats used by date-aware components. */
export const CK_DATE_FORMATS = new InjectionToken<CkDateFormats>(
  'CK_DATE_FORMATS',
)
