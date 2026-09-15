import { JsonPipe } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { CkCheckbox } from '@corekit/ui/checkbox'
import { provideNativeDateAdapter } from '@corekit/ui/core'
import { CkError, CkFormField } from '@corekit/ui/form-field'
import { CkInput, CkInputSuffix } from '@corekit/ui/input'
import { CkLabel } from '@corekit/ui/label'
import {
  CkTimeSelector,
  CkTimepicker,
  CkTimepickerInput,
  CkTimepickerToggle,
} from '@corekit/ui/timepicker'

@Component({
  selector: 'app-timepicker-page',
  imports: [
    CkCheckbox,
    CkError,
    CkFormField,
    CkInput,
    CkInputSuffix,
    CkLabel,
    CkTimeSelector,
    CkTimepicker,
    CkTimepickerInput,
    CkTimepickerToggle,
    JsonPipe,
    ReactiveFormsModule,
  ],
  templateUrl: './timepicker-page.component.html',
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block ck-typography' },
})
export class TimepickerPageComponent {
  /** Only the time of a boundary matters, so the day it falls on is arbitrary. */
  protected readonly minTime = new Date(2026, 0, 1, 9, 0)
  protected readonly maxTime = new Date(2026, 0, 1, 17, 30)

  protected readonly form = inject(FormBuilder).group({
    time: [new Date(2026, 6, 15, 14, 30), Validators.required],
  })

  protected readonly isFormDisabled = signal(false)

  protected readonly selectorTime = signal(new Date(2026, 6, 15, 14, 30))
  protected readonly clockTime = signal(new Date(2026, 6, 15, 14, 30))
  protected readonly boundedTime = signal(new Date(2026, 6, 15, 10, 0))

  /** Only the time of it matters, so the day it falls on is arbitrary. */
  protected readonly openAt = new Date(2026, 0, 1, 9, 0)

  protected toggleFormDisabled(): void {
    this.isFormDisabled.update(disabled => !disabled)

    if (this.isFormDisabled()) return this.form.disable()

    this.form.enable()
  }
}
