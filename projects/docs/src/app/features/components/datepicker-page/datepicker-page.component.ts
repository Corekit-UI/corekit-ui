import { Dir } from '@angular/cdk/bidi'
import { JsonPipe } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { CkCheckbox } from '@corekit/ui/checkbox'
import { CkDateAdapter, provideNativeDateAdapter } from '@corekit/ui/core'
import {
  CkCalendar,
  CkDateRange,
  CkDateRangeInput,
  CkDateRangePicker,
  CkDatepicker,
  CkDatepickerInput,
  CkDatepickerToggle,
  CkDefaultDateRangeSelectionStrategy,
  CkEndDate,
  CkStartDate,
} from '@corekit/ui/datepicker'
import { CkError, CkFormField } from '@corekit/ui/form-field'
import { CkInput, CkInputSuffix } from '@corekit/ui/input'
import { CkLabel } from '@corekit/ui/label'
import { FiveDayRangeComponent } from './five-day-range.component'

@Component({
  selector: 'app-datepicker-page',
  imports: [
    CkCalendar,
    CkCheckbox,
    Dir,
    CkDateRangeInput,
    CkDateRangePicker,
    CkDatepicker,
    CkDatepickerInput,
    CkDatepickerToggle,
    CkEndDate,
    CkError,
    CkFormField,
    CkInput,
    CkInputSuffix,
    CkLabel,
    CkStartDate,
    FiveDayRangeComponent,
    JsonPipe,
    ReactiveFormsModule,
  ],
  templateUrl: './datepicker-page.component.html',
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block ck-typography' },
})
export class DatepickerPageComponent {
  protected readonly minDate = new Date(2026, 6, 5)
  protected readonly maxDate = new Date(2026, 7, 20)
  protected readonly birthdayStartAt = new Date(2000, 0, 1)

  protected readonly form = inject(FormBuilder).group({
    date: [new Date(2026, 6, 15), Validators.required],
  })

  protected readonly rangeForm = inject(FormBuilder).group({
    start: [new Date(2026, 6, 10), Validators.required],
    end: [new Date(2026, 6, 20), Validators.required],
  })

  protected readonly isFormDisabled = signal(false)
  protected readonly isRangeDisabled = signal(false)
  protected readonly inlineDate = signal<Date | null>(null)
  protected readonly range = signal(new CkDateRange<Date>(null, null))

  private readonly _rangeStrategy = new CkDefaultDateRangeSelectionStrategy(
    inject<CkDateAdapter<Date>>(CkDateAdapter),
  )

  protected readonly noSundays = (date: Date): boolean => date.getDay() !== 0

  /** Composes the range out of the dates the calendar reports. */
  protected pickRange(date: Date | null): void {
    this.range.set(this._rangeStrategy.selectionFinished(date, this.range()))
  }

  protected toggleRangeDisabled(): void {
    this.isRangeDisabled.update(disabled => !disabled)

    if (this.isRangeDisabled()) return this.rangeForm.disable()

    this.rangeForm.enable()
  }

  protected toggleFormDisabled(): void {
    this.isFormDisabled.update(disabled => !disabled)

    if (this.isFormDisabled()) return this.form.controls.date.disable()

    this.form.controls.date.enable()
  }
}
