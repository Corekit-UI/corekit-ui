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

/** Number of months per year view row. */
const MONTHS_PER_ROW = 3

/** Month cell of the year view grid. */
type MonthCell<D> = CkCalendarCell<D> & {
  /** Whether the month contains the currently selected date. */
  isSelected: boolean

  /** Whether the month cannot be selected. */
  isDisabled: boolean

  /**
   * Whether the month is the tab stop of the grid. Only one cell is active at
   * a time — the roving tabindex pattern.
   */
  isActive: boolean

  /** CSS classes of the month button, resolved from the cell's state. */
  class: string
}

/** Year view of the calendar displaying a grid of months. */
@Component({
  selector: 'ck-year-view',
  exportAs: 'ckYearView',
  templateUrl: './year-view.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class CkYearView<D> extends CkCalendarViewBase<D> {
  /** Cells of the displayed year split into rows of months. */
  protected readonly _rows = computed<Array<Array<MonthCell<D>>>>(() => {
    const activeDate = this.activeDate()
    const year = this._dateAdapter.getYear(activeDate)
    const activeMonth = this._dateAdapter.getMonth(activeDate)
    const today = this._dateAdapter.today()
    const selected = this._selectedDate()
    const monthNames = this._dateAdapter.getMonthNames('short')

    const cells = monthNames.map((name, month) => {
      return this._createCell(name, year, month, activeMonth, today, selected)
    })

    return Array.from(
      { length: monthNames.length / MONTHS_PER_ROW },
      (_, row) => {
        return cells.slice(row * MONTHS_PER_ROW, row * MONTHS_PER_ROW + 3)
      },
    )
  })

  protected readonly _tableClass = calendarViewTableStyles
  protected readonly _rowClass = calendarViewRowStyles
  protected readonly _cellClass = calendarViewCellContainerStyles

  /** Emits the month of the clicked cell unless it's disabled. */
  protected _selectCell(cell: MonthCell<D>): void {
    if (cell.isDisabled) return

    this.selectedChange.emit(this._preserveDayOfMonth(cell.value))
  }

  protected _selectActiveDate(): void {
    const activeDate = this.activeDate()

    if (!this._isMonthEnabled(activeDate)) return

    this.selectedChange.emit(activeDate)
  }

  protected _dateFromKeyCode(keyCode: number): D | null {
    const activeDate = this.activeDate()

    switch (keyCode) {
      case LEFT_ARROW:
        return this._dateAdapter.addCalendarMonths(activeDate, -1)

      case RIGHT_ARROW:
        return this._dateAdapter.addCalendarMonths(activeDate, 1)

      case UP_ARROW:
        return this._dateAdapter.addCalendarMonths(activeDate, -MONTHS_PER_ROW)

      case DOWN_ARROW:
        return this._dateAdapter.addCalendarMonths(activeDate, MONTHS_PER_ROW)

      case HOME:
        return this._dateAdapter.addCalendarMonths(
          activeDate,
          -this._dateAdapter.getMonth(activeDate),
        )

      case END:
        return this._dateAdapter.addCalendarMonths(
          activeDate,
          11 - this._dateAdapter.getMonth(activeDate),
        )

      case PAGE_UP:
        return this._dateAdapter.addCalendarYears(activeDate, -1)

      case PAGE_DOWN:
        return this._dateAdapter.addCalendarYears(activeDate, 1)

      default:
        return null
    }
  }

  /**
   * Whether at least one day of the month is within the `min`/`max` range.
   *
   * The `dateFilter` is intentionally not consulted — it works on the day
   * granularity and is applied by the month view.
   */
  private _isMonthEnabled(date: D): boolean {
    const min = this._min()
    const max = this._max()

    const firstOfMonth = this._dateAdapter.createDate(
      this._dateAdapter.getYear(date),
      this._dateAdapter.getMonth(date),
      1,
    )

    const lastOfMonth = this._dateAdapter.createDate(
      this._dateAdapter.getYear(date),
      this._dateAdapter.getMonth(date),
      this._dateAdapter.getNumDaysInMonth(date),
    )

    return (
      (!min || this._dateAdapter.compareDate(lastOfMonth, min) >= 0) &&
      (!max || this._dateAdapter.compareDate(firstOfMonth, max) <= 0)
    )
  }

  /**
   * Transfers the active day of the month to the given month, clamping it to
   * the month's length, e.g. Jul 31 -> Feb 28.
   */
  private _preserveDayOfMonth(month: D): D {
    const day = Math.min(
      this._dateAdapter.getDate(this.activeDate()),
      this._dateAdapter.getNumDaysInMonth(month),
    )

    return this._dateAdapter.createDate(
      this._dateAdapter.getYear(month),
      this._dateAdapter.getMonth(month),
      day,
    )
  }

  private _createCell(
    name: string,
    year: number,
    month: number,
    activeMonth: number,
    today: D,
    selected: D | null,
  ): MonthCell<D> {
    const date = this._dateAdapter.createDate(year, month, 1)
    const isDisabled = !this._isMonthEnabled(date)

    const isSelected =
      !!selected &&
      this._dateAdapter.getYear(selected) === year &&
      this._dateAdapter.getMonth(selected) === month

    const isToday =
      this._dateAdapter.getYear(today) === year &&
      this._dateAdapter.getMonth(today) === month

    // Selection has priority over the current month highlight.
    const state = isSelected ? 'selected' : isToday ? 'today' : 'default'

    return {
      value: date,
      displayValue: name,
      ariaLabel: this._dateAdapter.format(
        date,
        this._dateFormats.display.monthYearA11yLabel,
      ),
      isSelected,
      isDisabled,
      isActive: month === activeMonth,
      class: classNames(
        calendarViewCellStyles({ state, disabled: isDisabled }),
        calendarViewFullWidthCellStyles,
      ),
    }
  }
}
