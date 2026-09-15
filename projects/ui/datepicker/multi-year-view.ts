import {
  DOWN_ARROW,
  END,
  HOME,
  LEFT_ARROW,
  PAGE_DOWN,
  PAGE_UP,
  RIGHT_ARROW,
  UP_ARROW,
} from '@angular/cdk/keycodes'
import { ChangeDetectionStrategy, Component, computed } from '@angular/core'
import { CkDateAdapter } from '@corekit/ui/core'
import { classNames } from '@corekit/ui/utils'
import { CkCalendarCell } from './calendar-cell'
import { CkCalendarViewBase } from './calendar-view'
import {
  calendarViewCellContainerStyles,
  calendarViewCellStyles,
  calendarViewFullWidthCellStyles,
  calendarViewRowStyles,
  calendarViewTableStyles,
} from './calendar-view.styles'

/** Number of years per multi-year view page. */
export const YEARS_PER_PAGE = 24

/** Number of years per multi-year view row. */
const YEARS_PER_ROW = 4

/**
 * First year of the multi-year page containing the date.
 *
 * Pages are anchored so that the `max` date lands on the last page cell, or
 * the `min` date on the first one — regardless of the currently active date.
 */
export function getMultiYearPageStart<D>(
  dateAdapter: CkDateAdapter<D>,
  date: D,
  min: D | null,
  max: D | null,
): number {
  const year = dateAdapter.getYear(date)

  return (
    year -
    euclideanModulo(
      year - getStartingYear(dateAdapter, min, max),
      YEARS_PER_PAGE,
    )
  )
}

/** Year all multi-year pages are aligned to. */
function getStartingYear<D>(
  dateAdapter: CkDateAdapter<D>,
  min: D | null,
  max: D | null,
): number {
  if (max) return dateAdapter.getYear(max) - YEARS_PER_PAGE + 1
  if (min) return dateAdapter.getYear(min)

  return 0
}

/** Modulo that stays positive for negative dividends. */
function euclideanModulo(a: number, b: number): number {
  return ((a % b) + b) % b
}

/** Year cell of the multi-year view grid. */
type YearCell<D> = CkCalendarCell<D> & {
  /** Whether the year contains the currently selected date. */
  isSelected: boolean

  /** Whether the year cannot be selected. */
  isDisabled: boolean

  /**
   * Whether the year is the tab stop of the grid. Only one cell is active at
   * a time — the roving tabindex pattern.
   */
  isActive: boolean

  /** CSS classes of the year button, resolved from the cell's state. */
  class: string
}

/** Multi-year view of the calendar displaying a page of years. */
@Component({
  selector: 'ck-multi-year-view',
  exportAs: 'ckMultiYearView',
  templateUrl: './multi-year-view.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class CkMultiYearView<D> extends CkCalendarViewBase<D> {
  /** Cells of the displayed years page split into rows. */
  protected readonly _rows = computed<Array<Array<YearCell<D>>>>(() => {
    const activeDate = this.activeDate()
    const activeYear = this._dateAdapter.getYear(activeDate)
    const todayYear = this._dateAdapter.getYear(this._dateAdapter.today())
    const selected = this._selectedDate()

    const selectedYear = selected ? this._dateAdapter.getYear(selected) : null

    const pageStart = getMultiYearPageStart(
      this._dateAdapter,
      activeDate,
      this._min(),
      this._max(),
    )

    const cells = Array.from({ length: YEARS_PER_PAGE }, (_, index) => {
      return this._createCell(
        pageStart + index,
        activeYear,
        todayYear,
        selectedYear,
      )
    })

    return Array.from({ length: YEARS_PER_PAGE / YEARS_PER_ROW }, (_, row) => {
      return cells.slice(
        row * YEARS_PER_ROW,
        row * YEARS_PER_ROW + YEARS_PER_ROW,
      )
    })
  })

  protected readonly _tableClass = calendarViewTableStyles
  protected readonly _rowClass = calendarViewRowStyles
  protected readonly _cellClass = calendarViewCellContainerStyles

  /** Emits the year of the clicked cell unless it's disabled. */
  protected _selectCell(cell: YearCell<D>): void {
    if (cell.isDisabled) return

    this.selectedChange.emit(
      this._preserveMonthAndDay(this._dateAdapter.getYear(cell.value)),
    )
  }

  protected _selectActiveDate(): void {
    const activeDate = this.activeDate()

    if (!this._isYearEnabled(this._dateAdapter.getYear(activeDate))) return

    this.selectedChange.emit(activeDate)
  }

  protected _dateFromKeyCode(keyCode: number): D | null {
    const activeDate = this.activeDate()

    const pageOffset =
      this._dateAdapter.getYear(activeDate) -
      getMultiYearPageStart(
        this._dateAdapter,
        activeDate,
        this._min(),
        this._max(),
      )

    switch (keyCode) {
      case LEFT_ARROW:
        return this._dateAdapter.addCalendarYears(activeDate, -1)

      case RIGHT_ARROW:
        return this._dateAdapter.addCalendarYears(activeDate, 1)

      case UP_ARROW:
        return this._dateAdapter.addCalendarYears(activeDate, -YEARS_PER_ROW)

      case DOWN_ARROW:
        return this._dateAdapter.addCalendarYears(activeDate, YEARS_PER_ROW)

      case HOME:
        return this._dateAdapter.addCalendarYears(activeDate, -pageOffset)

      case END:
        return this._dateAdapter.addCalendarYears(
          activeDate,
          YEARS_PER_PAGE - pageOffset - 1,
        )

      case PAGE_UP:
        return this._dateAdapter.addCalendarYears(activeDate, -YEARS_PER_PAGE)

      case PAGE_DOWN:
        return this._dateAdapter.addCalendarYears(activeDate, YEARS_PER_PAGE)

      default:
        return null
    }
  }

  /** Whether at least one day of the year is within the `min`/`max` range. */
  private _isYearEnabled(year: number): boolean {
    const min = this._min()
    const max = this._max()

    const firstOfYear = this._dateAdapter.createDate(year, 0, 1)
    const lastOfYear = this._dateAdapter.createDate(year, 11, 31)

    return (
      (!min || this._dateAdapter.compareDate(lastOfYear, min) >= 0) &&
      (!max || this._dateAdapter.compareDate(firstOfYear, max) <= 0)
    )
  }

  /**
   * Transfers the active month and day to the given year, clamping the day to
   * the month's length, e.g. Feb 29 2024 -> Feb 28 2025.
   */
  private _preserveMonthAndDay(year: number): D {
    const month = this._dateAdapter.getMonth(this.activeDate())

    const day = Math.min(
      this._dateAdapter.getDate(this.activeDate()),
      this._dateAdapter.getNumDaysInMonth(
        this._dateAdapter.createDate(year, month, 1),
      ),
    )

    return this._dateAdapter.createDate(year, month, day)
  }

  private _createCell(
    year: number,
    activeYear: number,
    todayYear: number,
    selectedYear: number | null,
  ): YearCell<D> {
    const date = this._dateAdapter.createDate(year, 0, 1)
    const isDisabled = !this._isYearEnabled(year)
    const isSelected = selectedYear === year
    const isToday = todayYear === year

    // Selection has priority over the current year highlight.
    const state = isSelected ? 'selected' : isToday ? 'today' : 'default'

    return {
      value: date,
      displayValue: this._dateAdapter.getYearName(date),
      ariaLabel: this._dateAdapter.getYearName(date),
      isSelected,
      isDisabled,
      isActive: year === activeYear,
      class: classNames(
        calendarViewCellStyles({ state, disabled: isDisabled }),
        calendarViewFullWidthCellStyles,
      ),
    }
  }
}
