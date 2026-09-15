import { Injectable } from '@angular/core'

/**
 * Datepicker strings announced by screen readers.
 *
 * Override it with a class provider to localize:
 *
 * ```ts
 * { provide: CkDatepickerIntl, useClass: MyDatepickerIntl }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class CkDatepickerIntl {
  /** Label of the previous month button in the month view. */
  public prevMonthLabel = 'Go to the previous month'

  /** Label of the next month button in the month view. */
  public nextMonthLabel = 'Go to the next month'

  /** Label of the previous year button in the year view. */
  public prevYearLabel = 'Go to the previous year'

  /** Label of the next year button in the year view. */
  public nextYearLabel = 'Go to the next year'

  /** Label of the previous years page button in the multi-year view. */
  public prevMultiYearLabel = 'Go to the previous 24 years'

  /** Label of the next years page button in the multi-year view. */
  public nextMultiYearLabel = 'Go to the next 24 years'

  /** Description of the day a selected range starts on. */
  public startDateLabel = 'Start date'

  /** Description of the day a selected range ends on. */
  public endDateLabel = 'End date'

  /** Label of the datepicker toggle button. */
  public openCalendarLabel = 'Open calendar'

  /** Label of the period button leading back to the month view. */
  public switchToMonthViewLabel = 'Choose date'

  /** Label of the period button leading to the year selection views. */
  public switchToMultiYearViewLabel = 'Choose month and year'

  /** Formats the years range displayed in the multi-year view header. */
  public formatYearRange(start: string, end: string): string {
    return `${start} – ${end}`
  }
}
