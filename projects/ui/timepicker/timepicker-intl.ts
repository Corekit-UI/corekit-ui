import { Injectable } from '@angular/core'

/**
 * Timepicker strings — both the ones on screen, such as the column headers
 * and the footer buttons, and the ones only screen readers announce, such as
 * the name of the toggle button.
 *
 * Override it with a class provider to localize:
 *
 * ```ts
 * { provide: CkTimepickerIntl, useClass: MyTimepickerIntl }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class CkTimepickerIntl {
  /** Accessible name of the toggle button, which only shows an icon. */
  public openClockLabel = 'Open clock'

  /** Accessible name of the popup panel. */
  public chooseTimeLabel = 'Choose time'

  /** Header of the hour column, announced as its name as well. */
  public hourLabel = 'Hour'

  /** Header of the minute column, announced as its name as well. */
  public minuteLabel = 'Minute'

  /** Header of the day period column, announced as its name as well. */
  public dayPeriodLabel = 'AM/PM'

  /** Label of the button keeping the picked time. */
  public setLabel = 'Set'

  /** Label of the button abandoning the picked time. */
  public cancelLabel = 'Cancel'
}
