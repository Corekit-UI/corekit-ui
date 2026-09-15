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
 * Fails with `ckDatepickerParse` when the typed text could not be parsed into
 * a date.
 */
export function parseDateValidator(
  isParseValid: () => boolean,
  getText: () => string,
): ValidatorFn {
  return (): ValidationErrors | null => {
    return isParseValid() ? null : { ckDatepickerParse: { text: getText() } }
  }
}

/** Fails with `ckDatepickerMin` when the date is before the minimum. */
export function minDateValidator<D>(
  dateAdapter: CkDateAdapter<D>,
  getMin: () => D | null,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const date = toDate(dateAdapter, control)
    const min = dateAdapter.getValidDateOrNull(getMin())

    if (!min || !date || dateAdapter.compareDate(min, date) <= 0) return null

    return { ckDatepickerMin: { min, actual: date } }
  }
}

/** Fails with `ckDatepickerMax` when the date is after the maximum. */
export function maxDateValidator<D>(
  dateAdapter: CkDateAdapter<D>,
  getMax: () => D | null,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const date = toDate(dateAdapter, control)
    const max = dateAdapter.getValidDateOrNull(getMax())

    if (!max || !date || dateAdapter.compareDate(max, date) >= 0) return null

    return { ckDatepickerMax: { max, actual: date } }
  }
}

/** Fails with `ckDatepickerFilter` when the date is rejected by the filter. */
export function dateFilterValidator<D>(
  dateAdapter: CkDateAdapter<D>,
  getDateFilter: () => ((date: D) => boolean) | null,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const date = toDate(dateAdapter, control)
    const dateFilter = getDateFilter()

    if (!dateFilter || !date || dateFilter(date)) return null

    return { ckDatepickerFilter: true }
  }
}

/**
 * Fails with `ckStartDateInvalid` when the start of a range comes after its
 * end.
 */
export function startDateValidator<D>(
  dateAdapter: CkDateAdapter<D>,
  getEnd: () => D | null,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const start = toDate(dateAdapter, control)
    const end = dateAdapter.getValidDateOrNull(getEnd())

    if (!start || !end || dateAdapter.compareDate(start, end) <= 0) return null

    return { ckStartDateInvalid: { end, actual: start } }
  }
}

/**
 * Fails with `ckEndDateInvalid` when the end of a range comes before its
 * start.
 */
export function endDateValidator<D>(
  dateAdapter: CkDateAdapter<D>,
  getStart: () => D | null,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const end = toDate(dateAdapter, control)
    const start = dateAdapter.getValidDateOrNull(getStart())

    if (!end || !start || dateAdapter.compareDate(end, start) >= 0) return null

    return { ckEndDateInvalid: { start, actual: end } }
  }
}
