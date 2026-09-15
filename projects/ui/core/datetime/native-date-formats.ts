import { CkDateFormats } from './date-formats'

/** Date formats for the `CkNativeDateAdapter`. */
export const CK_NATIVE_DATE_FORMATS: CkDateFormats = {
  parse: {
    dateInput: null,
    timeInput: null,
  },
  display: {
    dateInput: { year: 'numeric', month: 'numeric', day: 'numeric' },
    timeInput: { hour: 'numeric', minute: 'numeric' },
    monthYearLabel: { year: 'numeric', month: 'long' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
}
