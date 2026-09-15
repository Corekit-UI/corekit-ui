import { Injectable, InjectionToken } from '@angular/core'
import { CkDateAdapter } from '@corekit/ui/core'
import { CkDateRange } from './date-selection-model'

/**
 * Behavior of a date range selection — how the dates the user picks turn into
 * a range and what the calendar highlights while they are choosing.
 */
export type CkDateRangeSelectionStrategy<D> = {
  /**
   * Composes the new range out of the picked date and the current selection.
   * The date is `null` when the user cancels the selection, e.g. by pressing
   * Escape mid-selection.
   */
  selectionFinished(
    date: D | null,
    currentRange: CkDateRange<D>,
  ): CkDateRange<D>

  /**
   * Range to highlight while the user is hovering over a date or moving the
   * focus across the calendar. The date is `null` when the pointer or the
   * focus leaves the cells, and an empty range hides the highlight.
   */
  createPreview(
    activeDate: D | null,
    currentRange: CkDateRange<D>,
  ): CkDateRange<D>
}

/**
 * Customizes the date range selection behavior, e.g. to select a whole week at
 * a time. Provide it on the datepicker to affect a single one, or higher up in
 * the injector tree to affect all of them:
 *
 * ```ts
 * {
 *   provide: CK_DATE_RANGE_SELECTION_STRATEGY,
 *   useClass: MyWeekSelectionStrategy,
 * }
 * ```
 */
export const CK_DATE_RANGE_SELECTION_STRATEGY = new InjectionToken<
  CkDateRangeSelectionStrategy<unknown>
>('CK_DATE_RANGE_SELECTION_STRATEGY')

/**
 * Default range selection behavior: the user picks both ends of the range
 * themselves.
 */
// The strategy is provided by the datepicker that uses it, hence no
// `providedIn` — it also has to stay instantiable outside of an injector.
// eslint-disable-next-line @angular-eslint/use-injectable-provided-in
@Injectable()
export class CkDefaultDateRangeSelectionStrategy<D>
  implements CkDateRangeSelectionStrategy<D>
{
  constructor(private readonly _dateAdapter: CkDateAdapter<D>) {}

  public selectionFinished(
    date: D | null,
    currentRange: CkDateRange<D>,
  ): CkDateRange<D> {
    const { start, end } = currentRange

    // The first pick opens the range, the second one closes it. A date before
    // the start opens a new range instead of closing the current one
    // backwards, and so does a pick into an already complete range.
    if (start === null) return new CkDateRange<D>(date, null)

    const closesRange =
      end === null &&
      date !== null &&
      this._dateAdapter.compareDate(date, start) >= 0

    return closesRange
      ? new CkDateRange<D>(start, date)
      : new CkDateRange<D>(date, null)
  }

  public createPreview(
    activeDate: D | null,
    currentRange: CkDateRange<D>,
  ): CkDateRange<D> {
    const { start, end } = currentRange

    // Only a half-picked range has something to preview.
    return start !== null && end === null && activeDate !== null
      ? new CkDateRange<D>(start, activeDate)
      : new CkDateRange<D>(null, null)
  }
}
