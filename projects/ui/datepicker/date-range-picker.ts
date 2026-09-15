import { CdkTrapFocus } from '@angular/cdk/a11y'
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Provider,
} from '@angular/core'
import { CkDateAdapter } from '@corekit/ui/core'
import { CkCalendar } from './calendar'
import {
  CK_DATE_RANGE_SELECTION_STRATEGY,
  CkDateRangeSelectionStrategy,
  CkDefaultDateRangeSelectionStrategy,
} from './date-range-selection-strategy'
import {
  CK_RANGE_DATE_SELECTION_MODEL_PROVIDER,
  CkDateRange,
} from './date-selection-model'
import { CkDatepickerBase } from './datepicker-base'
import { CkDatepickerControl } from './datepicker-control'

/**
 * Provides the default selection strategy, unless the consumer has already
 * provided one further up the injector tree — a strategy given to the whole
 * application should not be shadowed by every range picker in it.
 */
const RANGE_SELECTION_STRATEGY_PROVIDER: Provider = {
  provide: CK_DATE_RANGE_SELECTION_STRATEGY,
  useFactory: () => {
    return (
      inject(CK_DATE_RANGE_SELECTION_STRATEGY, {
        optional: true,
        skipSelf: true,
      }) ?? new CkDefaultDateRangeSelectionStrategy(inject(CkDateAdapter))
    )
  },
}

/** Datepicker popup panel selecting a range of dates. */
@Component({
  selector: 'ck-date-range-picker',
  exportAs: 'ckDateRangePicker',
  imports: [CdkTrapFocus, CkCalendar],
  // The panel is the same no matter what the datepicker selects.
  templateUrl: './datepicker.html',
  providers: [
    CK_RANGE_DATE_SELECTION_MODEL_PROVIDER,
    RANGE_SELECTION_STRATEGY_PROVIDER,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'hidden' },
})
export class CkDateRangePicker<D> extends CkDatepickerBase<
  CkDatepickerControl<D>,
  CkDateRange<D>,
  D
> {
  private readonly _rangeStrategy = inject<CkDateRangeSelectionStrategy<D>>(
    CK_DATE_RANGE_SELECTION_STRATEGY,
  )

  /**
   * Composes the picked date into the range. A `null` date means the user has
   * abandoned the selection, which the strategy turns into an empty range.
   */
  protected _selectionFinished(date: D | null): void {
    const range = this._rangeStrategy.selectionFinished(
      date,
      this._model.selection(),
    )

    this._model.updateSelection(range, this)
  }
}
