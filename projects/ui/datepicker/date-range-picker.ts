import { CdkTrapFocus } from '@angular/cdk/a11y'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  Provider,
} from '@angular/core'
import { CkDateAdapter, CkDateNameStyle } from '@corekit/ui/core'
import { CkCalendar, CkCalendarView } from './calendar'
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
import { CkCalendarDatepickerControl } from './datepicker-control'

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
  CkCalendarDatepickerControl<D>,
  CkDateRange<D>,
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
