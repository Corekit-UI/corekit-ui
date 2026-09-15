import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Injectable,
} from '@angular/core'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import { CkDateAdapter } from '@corekit/ui/core'
import {
  CK_DATE_RANGE_SELECTION_STRATEGY,
  CkDateRange,
  CkDateRangeInput,
  CkDateRangePicker,
  CkDateRangeSelectionStrategy,
  CkDatepickerToggle,
  CkEndDate,
  CkStartDate,
} from '@corekit/ui/datepicker'
import { CkFormField } from '@corekit/ui/form-field'
import { CkInputSuffix } from '@corekit/ui/input'
import { CkLabel } from '@corekit/ui/label'

/**
 * Picks five days at a time: whichever day is chosen becomes the start of the
 * range, and the four days after it come along.
 */
// The strategy is provided by the component that hosts the picker.
// eslint-disable-next-line @angular-eslint/use-injectable-provided-in
@Injectable()
export class FiveDayRangeSelectionStrategy
  implements CkDateRangeSelectionStrategy<Date>
{
  constructor(private readonly _dateAdapter: CkDateAdapter<Date>) {}

  public selectionFinished(date: Date | null): CkDateRange<Date> {
    return this._fiveDaysFrom(date)
  }

  public createPreview(activeDate: Date | null): CkDateRange<Date> {
    return this._fiveDaysFrom(activeDate)
  }

  private _fiveDaysFrom(date: Date | null): CkDateRange<Date> {
    if (!date) return new CkDateRange<Date>(null, null)

    return new CkDateRange(date, this._dateAdapter.addCalendarDays(date, 4))
  }
}

@Component({
  selector: 'app-five-day-range',
  imports: [
    CkDateRangeInput,
    CkDateRangePicker,
    CkDatepickerToggle,
    CkEndDate,
    CkFormField,
    CkInputSuffix,
    CkLabel,
    CkStartDate,
    ReactiveFormsModule,
  ],
  templateUrl: './five-day-range.component.html',
  // Scoped to this component, so that the other pickers on the page keep
  // composing ranges the default way.
  providers: [
    {
      provide: CK_DATE_RANGE_SELECTION_STRATEGY,
      useClass: FiveDayRangeSelectionStrategy,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class FiveDayRangeComponent {
  protected readonly form = inject(FormBuilder).group({
    start: [null as Date | null],
    end: [null as Date | null],
  })
}
