import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms'
import { CkDateAdapter } from '@corekit/ui/core'

/**
 * Converts a form control value to a date, since a control can hold anything
 * the consumer put there, e.g. an ISO string.
 */
function toDate<D>(
  dateAdapter: CkDateAdapter<D>,
  control: AbstractControl,
): D | null {
  return dateAdapter.getValidDateOrNull(
    dateAdapter.deserialize(control.value as unknown),
  )
}

/**
 * Compares the times of two dates down to the minute, whatever days they fall
 * on. The timepicker neither shows nor picks anything finer, so seconds could
 * only produce errors about a difference nobody can see.
 */
function compareMinutes<D>(
  dateAdapter: CkDateAdapter<D>,
  first: D,
  second: D,
): number {
  return (
    dateAdapter.getHours(first) - dateAdapter.getHours(second) ||
    dateAdapter.getMinutes(first) - dateAdapter.getMinutes(second)
  )
}

/**
 * Fails with `ckTimepickerParse` when the typed text could not be parsed into
 * a time.
 */
export function parseTimeValidator(
  isParseValid: () => boolean,
  getText: () => string,
): ValidatorFn {
  return (): ValidationErrors | null => {
    return isParseValid() ? null : { ckTimepickerParse: { text: getText() } }
  }
}

/**
 * Fails with `ckTimepickerMin` when the time is before the minimum. Only the
 * hour and the minute are compared, so neither the day nor the seconds of
 * either value are of any consequence.
 */
export function minTimeValidator<D>(
  dateAdapter: CkDateAdapter<D>,
  getMin: () => D | null,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const time = toDate(dateAdapter, control)
    const min = dateAdapter.getValidDateOrNull(getMin())

    if (!min || !time) return null
    if (compareMinutes(dateAdapter, min, time) <= 0) return null

    return { ckTimepickerMin: { min, actual: time } }
  }
}

/**
 * Fails with `ckTimepickerMax` when the time is after the maximum. Only the
 * hour and the minute are compared, so neither the day nor the seconds of
 * either value are of any consequence.
 */
export function maxTimeValidator<D>(
  dateAdapter: CkDateAdapter<D>,
  getMax: () => D | null,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const time = toDate(dateAdapter, control)
    const max = dateAdapter.getValidDateOrNull(getMax())

    if (!max || !time) return null
    if (compareMinutes(dateAdapter, max, time) >= 0) return null

    return { ckTimepickerMax: { max, actual: time } }
  }
}
