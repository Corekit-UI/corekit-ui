import { CdkTrapFocus } from '@angular/cdk/a11y'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { CkCalendar } from './calendar'
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
  /**
   * Picking a date replaces the selection. There is nothing to abandon in a
   * single date selection, so a `null` date is ignored.
   */
  protected _selectionFinished(date: D | null): void {
    if (date === null) return

    this._model.updateSelection(date, this)
  }
}
