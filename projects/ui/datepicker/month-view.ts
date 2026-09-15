import {
  DOWN_ARROW,
  END,
  ESCAPE,
  hasModifierKey,
  HOME,
  LEFT_ARROW,
  PAGE_DOWN,
  PAGE_UP,
  RIGHT_ARROW,
  UP_ARROW,
} from '@angular/cdk/keycodes'
import { _IdGenerator } from '@angular/cdk/a11y'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core'
import { CkDateNameStyle } from '@corekit/ui/core'
import { classNames } from '@corekit/ui/utils'
import { CkCalendarCell } from './calendar-cell'
import { CkCalendarViewBase } from './calendar-view'
import {
  calendarViewCellStyles,
  calendarViewRangeStyles,
} from './calendar-view.styles'
import {
  CK_DATE_RANGE_SELECTION_STRATEGY,
  CkDateRangeSelectionStrategy,
  CkDefaultDateRangeSelectionStrategy,
} from './date-range-selection-strategy'
import { CkDateRange } from './date-selection-model'
import { CkDatepickerIntl } from './datepicker-intl'
import {
  monthViewCellStyles,
  monthViewDayStyles,
  monthViewStyles,
  monthViewTableStyles,
  monthViewWeekdayStyles,
  monthViewWeekRowStyles,
} from './month-view.styles'

/** Weekday to be rendered in the month view header row. */
type Weekday = {
  /** Full name announced by screen readers, e.g. `Sunday`. */
  long: string

  /** Name rendered in the row, e.g. `Sun`. */
  display: string
}

/**
 * Day of the displayed month, with everything about it that no selection can
 * change. Formatting a date is expensive, so this is kept out of the way of
 * hovering and picking.
 */
type MonthDay<D> = CkCalendarCell<D> & {
  /** Whether the day cannot be selected. */
  isDisabled: boolean
}

/** Day cell of the month view grid. */
type DayCell<D> = CkCalendarCell<D> & {
  /** Whether the day is one of the ends of the selection. */
  isSelected: boolean

  /** Whether the day cannot be selected. */
  isDisabled: boolean

  /** CSS classes of the day button, resolved from the cell's state. */
  class: string

  /** CSS classes of the cell around the button, holding the range band. */
  containerClass: string

  /**
   * IDs of the labels telling which end of the range the day is, `null` for
   * the days that are neither.
   */
  describedBy: string | null
}

/** Month view of the calendar displaying a grid of days. */
@Component({
  selector: 'ck-month-view',
  exportAs: 'ckMonthView',
  templateUrl: './month-view.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': '_class' },
})
export class CkMonthView<D> extends CkCalendarViewBase<D> {
  /** Style of the weekday names in the header row. */
  public readonly weekdayStyle = input<CkDateNameStyle>('short')

  /**
   * Event emitted when the user abandons a range selection in progress, by
   * pressing Escape after picking its start.
   */
  public readonly selectionCancelled = output()

  /**
   * Weekday names in render order, starting from the adapter's first day of
   * the week.
   */
  protected readonly _weekdays = computed<Weekday[]>(() => {
    const firstDayOfWeek = this._dateAdapter.getFirstDayOfWeek()
    const longNames = this._dateAdapter.getDayOfWeekNames('long')
    const displayNames = this._dateAdapter.getDayOfWeekNames(
      this.weekdayStyle(),
    )

    return Array.from({ length: 7 }, (_, index) => {
      const day = (firstDayOfWeek + index) % 7

      return { long: longNames[day], display: displayNames[day] }
    })
  })

  /**
   * Cells of the displayed month split into weeks. Cells outside of the month
   * are `null` and rendered blank.
   */
  protected readonly _weeks = computed<Array<Array<DayCell<D> | null>>>(() => {
    const today = this._dateAdapter.today()
    const selected = this._selectedRange()
    const preview = this._preview()

    const cells = this._days().map(day => {
      return day && this._createCell(day, today, selected, preview)
    })

    return Array.from({ length: cells.length / 7 }, (_, week) => {
      return cells.slice(week * 7, week * 7 + 7)
    })
  })

  /** Labels describing the ends of the range to screen readers. */
  protected readonly _intl = inject(CkDatepickerIntl)

  protected readonly _startLabelId = inject(_IdGenerator).getId(
    'ck-range-start-label-',
  )

  protected readonly _endLabelId = inject(_IdGenerator).getId(
    'ck-range-end-label-',
  )

  protected readonly _class = monthViewStyles
  protected readonly _tableClass = monthViewTableStyles
  protected readonly _weekRowClass = monthViewWeekRowStyles
  protected readonly _weekdayClass = monthViewWeekdayStyles
  protected readonly _cellClass = monthViewCellStyles

  /**
   * The selection as a range: a single date becomes a range that starts and
   * ends on it. Lets one set of rules render both — the ends of a range are
   * highlighted exactly like a selected day, and a range that starts and ends
   * on the same day draws no band.
   */
  private readonly _selectedRange = computed(() => {
    const selected = this.selected()

    if (selected instanceof CkDateRange) return selected

    return new CkDateRange<D>(selected, selected)
  })

  /**
   * Year and month on display. Notifies only when the grid actually moves to
   * another month, so that walking the days within one doesn't rebuild it.
   */
  private readonly _month = computed(
    () => {
      const activeDate = this.activeDate()

      return {
        year: this._dateAdapter.getYear(activeDate),
        month: this._dateAdapter.getMonth(activeDate),
      }
    },
    { equal: (a, b) => a.year === b.year && a.month === b.month },
  )

  /**
   * Days of the displayed month, with the blanks that pad the first and the
   * last week. Depends on the month and the boundaries alone — the names of
   * the days and their accessible labels survive every hover and every pick.
   */
  private readonly _days = computed<Array<MonthDay<D> | null>>(() => {
    const { year, month } = this._month()
    const firstOfMonth = this._dateAdapter.createDate(year, month, 1)
    const numDays = this._dateAdapter.getNumDaysInMonth(firstOfMonth)
    const firstWeekOffset = this._weekOffset(firstOfMonth)

    // Building these costs a date formatter each, so they are made once for
    // the whole month rather than once per day.
    const dateNames = this._dateAdapter.getDateNames()
    const totalCells = Math.ceil((firstWeekOffset + numDays) / 7) * 7

    return Array.from({ length: totalCells }, (_, index) => {
      const day = index - firstWeekOffset + 1

      if (day < 1 || day > numDays) return null

      const date = this._dateAdapter.createDate(year, month, day)

      return {
        value: date,
        displayValue: dateNames[day - 1],
        ariaLabel: this._dateAdapter.format(
          date,
          this._dateFormats.display.dateA11yLabel,
        ),
        isDisabled: !this._isDateEnabled(date),
      }
    })
  })

  /**
   * Range highlighted while the user is choosing the end of a range. Pointing
   * at a day that yields the very same range is not a change.
   */
  private readonly _preview = signal(new CkDateRange<D>(null, null), {
    equal: (a, b) => {
      return (
        this._dateAdapter.sameDate(a.start, b.start) &&
        this._dateAdapter.sameDate(a.end, b.end)
      )
    },
  })

  /**
   * Composes the ranges out of the picked dates. Falls back to the default
   * behavior, so that a calendar used on its own previews ranges too.
   */
  private readonly _rangeStrategy =
    inject<CkDateRangeSelectionStrategy<D>>(CK_DATE_RANGE_SELECTION_STRATEGY, {
      optional: true,
    }) ?? new CkDefaultDateRangeSelectionStrategy<D>(this._dateAdapter)

  /**
   * Whether the day owns the tab stop of the grid — the roving tabindex
   * pattern. Read per render rather than baked into the cell, so that moving
   * the tab stop doesn't rebuild the month.
   */
  protected _isActive(cell: DayCell<D>): boolean {
    return this._dateAdapter.sameDate(cell.value, this.activeDate())
  }

  /** Emits the date of the clicked cell unless it's disabled or selected. */
  protected _selectCell(cell: DayCell<D>): void {
    this._selectDate(cell.value, cell.isDisabled)
  }

  protected _selectActiveDate(): void {
    const activeDate = this.activeDate()

    this._selectDate(activeDate, !this._isDateEnabled(activeDate))
  }

  /**
   * Previews the range that picking the day would produce. The day is `null`
   * when the user points away from the grid.
   */
  protected _previewChanged(cell: DayCell<D> | null): void {
    const selected = this.selected()

    // Only a range selection has something to preview.
    if (!(selected instanceof CkDateRange)) return

    const date = cell && !cell.isDisabled ? cell.value : null

    this._preview.set(this._rangeStrategy.createPreview(date, selected))
  }

  /** Drops the previewed range, e.g. when the pointer leaves the grid. */
  protected _clearPreview(): void {
    this._preview.set(new CkDateRange<D>(null, null))
  }

  /**
   * Abandons a range selection in progress on Escape, leaving the other keys
   * to the shared navigation.
   */
  protected override _handleKeydown(event: KeyboardEvent): void {
    const isAbandoning =
      event.keyCode === ESCAPE &&
      !hasModifierKey(event) &&
      this._preview().end !== null

    if (!isAbandoning) return super._handleKeydown(event)

    this._clearPreview()
    this.selectionCancelled.emit()

    event.preventDefault()

    // Escape abandons the selection instead of closing the popup around it.
    event.stopPropagation()
  }

  protected _dateFromKeyCode(keyCode: number): D | null {
    const activeDate = this.activeDate()
    const year = this._dateAdapter.getYear(activeDate)
    const month = this._dateAdapter.getMonth(activeDate)

    switch (keyCode) {
      case LEFT_ARROW:
        return this._dateAdapter.addCalendarDays(activeDate, -1)

      case RIGHT_ARROW:
        return this._dateAdapter.addCalendarDays(activeDate, 1)

      case UP_ARROW:
        return this._dateAdapter.addCalendarDays(activeDate, -7)

      case DOWN_ARROW:
        return this._dateAdapter.addCalendarDays(activeDate, 7)

      case HOME:
        return this._dateAdapter.createDate(year, month, 1)

      case END:
        return this._dateAdapter.createDate(
          year,
          month,
          this._dateAdapter.getNumDaysInMonth(activeDate),
        )

      case PAGE_UP:
        return this._dateAdapter.addCalendarMonths(activeDate, -1)

      case PAGE_DOWN:
        return this._dateAdapter.addCalendarMonths(activeDate, 1)

      default:
        return null
    }
  }

  /**
   * Emits the date unless it's disabled.
   *
   * Picking the already selected date emits too, so that consumers can react
   * to the user's action itself, e.g. close a popup.
   */
  private _selectDate(date: D, isDisabled: boolean): void {
    if (isDisabled) return

    // The preview is rebuilt from the new selection as soon as the user
    // points at a day again.
    this._clearPreview()
    this.selectedChange.emit(date)
  }

  /** Whether the date is within `min`/`max` and passes the `dateFilter`. */
  private _isDateEnabled(date: D): boolean {
    const min = this._min()
    const max = this._max()

    return (
      (!min || this._dateAdapter.compareDate(date, min) >= 0) &&
      (!max || this._dateAdapter.compareDate(date, max) <= 0) &&
      (this.dateFilter()?.(date) ?? true)
    )
  }

  /** Number of cells the given date is offset from the start of its week. */
  private _weekOffset(date: D): number {
    return (
      (7 +
        this._dateAdapter.getDayOfWeek(date) -
        this._dateAdapter.getFirstDayOfWeek()) %
      7
    )
  }

  /**
   * Whether the day opens the range.
   *
   * A range that starts and ends on the same day is not drawn as a band at
   * all — it is a single selected day, and so is every range still missing
   * one of its ends.
   */
  private _isRangeStart(date: D, range: CkDateRange<D>): boolean {
    const { start, end } = range

    return (
      start !== null &&
      end !== null &&
      !this._dateAdapter.sameDate(start, end) &&
      this._dateAdapter.sameDate(date, start)
    )
  }

  /** Whether the day closes the range. */
  private _isRangeEnd(date: D, range: CkDateRange<D>): boolean {
    const { start, end } = range

    return (
      start !== null &&
      end !== null &&
      !this._dateAdapter.sameDate(start, end) &&
      this._dateAdapter.sameDate(date, end)
    )
  }

  /** Whether the day is covered by the range, its ends included. */
  private _isInRange(date: D, range: CkDateRange<D>): boolean {
    const { start, end } = range

    if (start === null || end === null) return false
    if (this._dateAdapter.sameDate(start, end)) return false

    return (
      this._dateAdapter.compareDate(date, start) >= 0 &&
      this._dateAdapter.compareDate(date, end) <= 0
    )
  }

  /**
   * Labels of the ends of the range the day is at. A day is only described as
   * an end while a range is being selected — a single date needs no such
   * hint.
   */
  private _describedBy(date: D, selected: CkDateRange<D>): string | null {
    if (!(this.selected() instanceof CkDateRange)) return null

    const isStart = this._dateAdapter.sameDate(date, selected.start)
    const isEnd = this._dateAdapter.sameDate(date, selected.end)

    if (isStart && isEnd) return `${this._startLabelId} ${this._endLabelId}`
    if (isStart) return this._startLabelId
    if (isEnd) return this._endLabelId

    return null
  }

  private _createCell(
    day: MonthDay<D>,
    today: D,
    selected: CkDateRange<D>,
    preview: CkDateRange<D>,
  ): DayCell<D> {
    const date = day.value

    const isSelected =
      this._dateAdapter.sameDate(date, selected.start) ||
      this._dateAdapter.sameDate(date, selected.end)

    const isToday = this._dateAdapter.sameDate(date, today)

    // Selection has priority over the today highlight.
    const cellState = isSelected ? 'selected' : isToday ? 'today' : 'default'

    return {
      ...day,
      isSelected,
      describedBy: this._describedBy(date, selected),
      class: classNames(
        calendarViewCellStyles({ state: cellState, disabled: day.isDisabled }),
        monthViewDayStyles,
      ),
      containerClass: classNames(
        monthViewCellStyles,
        calendarViewRangeStyles({
          inRange: this._isInRange(date, selected),
          rangeStart: this._isRangeStart(date, selected),
          rangeEnd: this._isRangeEnd(date, selected),
          inPreview: this._isInRange(date, preview),
          previewStart: this._isRangeStart(date, preview),
          previewEnd: this._isRangeEnd(date, preview),
        }),
      ),
    }
  }
}
