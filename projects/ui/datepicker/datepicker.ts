import { CdkTrapFocus } from '@angular/cdk/a11y'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core'
import { CkDateNameStyle } from '@corekit/ui/core'
import { CkCalendar, CkCalendarView } from './calendar'
import { CK_SINGLE_DATE_SELECTION_MODEL_PROVIDER } from './date-selection-model'
import { CkDatepickerBase } from './datepicker-base'
import { CkDatepickerInput } from './datepicker-input'

/** Datepicker popup panel selecting a single date. */
@Component({
  selector: 'ck-datepicker',
  exportAs: 'ckDatepicker',
  imports: [CdkTrapFocus, CkCalendar],
  templateUrl: './datepicker.html',
  providers: [CK_SINGLE_DATE_SELECTION_MODEL_PROVIDER],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'hidden' },
})
export class CkDatepicker<D> extends CkDatepickerBase<
  CkDatepickerInput<D>,
  D | null,
  D
> {
  /** The view the calendar is opened at. */
  public readonly startView = input<CkCalendarView>('month')

  /** Style of the weekday names in the month view header row. */
  public readonly weekdayStyle = input<CkDateNameStyle>('short')

  /**
   * Days the calendar turns down, e.g. weekends. Belongs to the control, as
   * it also drives its validation.
   */
  protected readonly _dateFilter = computed(() => {
    return this._input()?.dateFilter() ?? null
  })

  /**
   * Picking a date replaces the selection. There is nothing to abandon in a
   * single date selection, so a `null` date is ignored.
   */
  protected _selectionFinished(date: D | null): void {
    if (date === null) return

    this._model.updateSelection(date, this)
  }
}
