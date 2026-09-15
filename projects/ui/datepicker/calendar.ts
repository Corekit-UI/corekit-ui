import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  linkedSignal,
  model,
  output,
} from '@angular/core'
import {
  CK_DATE_FORMATS,
  CkDateAdapter,
  CkDateNameStyle,
} from '@corekit/ui/core'
import { classNames } from '@corekit/ui/utils'
import { CkCalendarHeader } from './calendar-header'
import { CkDateRange } from './date-selection-model'
import { calendarStyles } from './calendar.styles'
import { CkDatepickerIntl } from './datepicker-intl'
import { CkMonthView } from './month-view'
import {
  CkMultiYearView,
  getMultiYearPageStart,
  YEARS_PER_PAGE,
} from './multi-year-view'
import { CkYearView } from './year-view'

/** Views the calendar can display. */
export type CkCalendarView = 'month' | 'year' | 'multi-year'

/** Calendar allowing to select a single date. */
@Component({
  selector: 'ck-calendar, [ck-calendar]',
  exportAs: 'ckCalendar',
  imports: [CkCalendarHeader, CkMonthView, CkMultiYearView, CkYearView],
  templateUrl: './calendar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': '_class()' },
})
export class CkCalendar<D> {
  public readonly class = input<string>()

  /** The currently selected date. */
  public readonly selected = model<D | CkDateRange<D> | null>(null)

  /**
   * Event emitted when the user picks a date, even when it doesn't change the
   * {@link selected `selected`} value. Emits `null` when the user abandons a
   * range selection in progress.
   */
  public readonly userSelection = output<D | null>()

  /** The date the calendar is initially opened at. Defaults to today. */
  public readonly startAt = input<D | null>(null)

  /** The view the calendar is initially opened at. */
  public readonly startView = input<CkCalendarView>('month')

  /** The minimum selectable date. */
  public readonly min = input<D | null>(null)

  /** The maximum selectable date. */
  public readonly max = input<D | null>(null)

  /** Function disabling arbitrary dates, e.g. weekends. */
  public readonly dateFilter = input<((date: D) => boolean) | null>(null)

  /** Style of the weekday names in the month view header row. */
  public readonly weekdayStyle = input<CkDateNameStyle>('short')

  private readonly _dateAdapter = inject<CkDateAdapter<D>>(CkDateAdapter)
  private readonly _dateFormats = inject(CK_DATE_FORMATS)
  private readonly _intl = inject(CkDatepickerIntl)
  private readonly _elementRef = inject<ElementRef<HTMLElement>>(ElementRef)
  private readonly _injector = inject(Injector)

  /** Valid `min` boundary, `null` when absent or invalid. */
  private readonly _min = computed(() => {
    return this._dateAdapter.getValidDateOrNull(this.min())
  })

  /** Valid `max` boundary, `null` when absent or invalid. */
  private readonly _max = computed(() => {
    return this._dateAdapter.getValidDateOrNull(this.max())
  })

  /**
   * The date defining the currently displayed period. Navigation moves it,
   * selection and focus will be anchored to it.
   *
   * Always stays within the boundaries, so that the calendar never opens on a
   * period holding nothing to pick.
   */
  protected readonly _activeDate = linkedSignal(() => {
    return this._clampDate(
      this._dateAdapter.getValidDateOrNull(this.startAt()) ??
        this._dateAdapter.today(),
    )
  })

  /** The currently displayed view. */
  protected readonly _currentView = linkedSignal(() => this.startView())

  /**
   * Label of the currently displayed period, e.g. `July 2026`, `2026` or
   * `2016 – 2039`.
   */
  protected readonly _periodLabel = computed(() => {
    switch (this._currentView()) {
      case 'year':
        return this._dateAdapter.getYearName(this._activeDate())

      case 'multi-year':
        return this._intl.formatYearRange(...this._yearsPageRange())

      default:
        return this._dateAdapter.format(
          this._activeDate(),
          this._dateFormats.display.monthYearLabel,
        )
    }
  })

  /** Accessible label of the previous period button. */
  protected readonly _previousButtonLabel = computed(() => {
    switch (this._currentView()) {
      case 'year':
        return this._intl.prevYearLabel

      case 'multi-year':
        return this._intl.prevMultiYearLabel

      default:
        return this._intl.prevMonthLabel
    }
  })

  /** Accessible label of the next period button. */
  protected readonly _nextButtonLabel = computed(() => {
    switch (this._currentView()) {
      case 'year':
        return this._intl.nextYearLabel

      case 'multi-year':
        return this._intl.nextMultiYearLabel

      default:
        return this._intl.nextMonthLabel
    }
  })

  /** Names of the first and the last year of the multi-year page. */
  private readonly _yearsPageRange = computed<[string, string]>(() => {
    const pageStart = getMultiYearPageStart(
      this._dateAdapter,
      this._activeDate(),
      this._min(),
      this._max(),
    )

    const yearName = (year: number): string => {
      return this._dateAdapter.getYearName(
        this._dateAdapter.createDate(year, 0, 1),
      )
    }

    return [yearName(pageStart), yearName(pageStart + YEARS_PER_PAGE - 1)]
  })

  /** Accessible label of the period button. */
  protected readonly _periodButtonLabel = computed(() => {
    return this._currentView() === 'month'
      ? this._intl.switchToMultiYearViewLabel
      : this._intl.switchToMonthViewLabel
  })

  /** Whether the entire previous period is before the `min` date. */
  protected readonly _previousDisabled = computed(() => {
    const min = this._min()

    if (!min) return false

    const lastOfPreviousPeriod = this._dateAdapter.addCalendarDays(
      this._firstOfPeriod(),
      -1,
    )

    return this._dateAdapter.compareDate(lastOfPreviousPeriod, min) < 0
  })

  /** Whether the entire next period is after the `max` date. */
  protected readonly _nextDisabled = computed(() => {
    const max = this._max()

    if (!max) return false

    return this._dateAdapter.compareDate(this._firstOfNextPeriod(), max) > 0
  })

  /** First day of the currently displayed period — month, year or years page. */
  private readonly _firstOfPeriod = computed(() => {
    const year = this._dateAdapter.getYear(this._activeDate())

    switch (this._currentView()) {
      case 'year':
        return this._dateAdapter.createDate(year, 0, 1)

      case 'multi-year':
        return this._dateAdapter.createDate(
          getMultiYearPageStart(
            this._dateAdapter,
            this._activeDate(),
            this._min(),
            this._max(),
          ),
          0,
          1,
        )

      default:
        return this._dateAdapter.createDate(
          year,
          this._dateAdapter.getMonth(this._activeDate()),
          1,
        )
    }
  })

  /** First day of the period following the displayed one. */
  private readonly _firstOfNextPeriod = computed(() => {
    switch (this._currentView()) {
      case 'year':
        return this._dateAdapter.addCalendarYears(this._firstOfPeriod(), 1)

      case 'multi-year':
        return this._dateAdapter.addCalendarYears(
          this._firstOfPeriod(),
          YEARS_PER_PAGE,
        )

      default:
        return this._dateAdapter.addCalendarMonths(this._firstOfPeriod(), 1)
    }
  })

  protected readonly _class = computed(() => {
    return classNames(calendarStyles, this.class())
  })

  /** Selects the date and keeps the keyboard focus anchored to it. */
  protected _dateSelected(date: D): void {
    const selected = this.selected()

    // A range is composed by whoever owns the selection — the calendar only
    // reports the picked date and leaves the range alone.
    if (
      !(selected instanceof CkDateRange) &&
      !this._dateAdapter.sameDate(date, selected)
    ) {
      this.selected.set(date)
    }

    this._setActiveDate(date)
    this.userSelection.emit(date)
  }

  /** Reports a range selection the user has abandoned. */
  protected _selectionCancelled(): void {
    this.userSelection.emit(null)
  }

  /**
   * Switches the month view to the multi-year view, the other views back to
   * the month view.
   */
  protected _periodClicked(): void {
    this._currentView.set(
      this._currentView() === 'month' ? 'multi-year' : 'month',
    )
    this._focusActiveCellAfterRender()
  }

  /** Moves the calendar to the year and descends into the year view. */
  protected _yearSelected(year: D): void {
    this._setActiveDate(year)
    this._currentView.set('year')
    this._focusActiveCellAfterRender()
  }

  /** Moves the calendar to the month and returns to the month view. */
  protected _monthSelected(month: D): void {
    this._setActiveDate(month)
    this._currentView.set('month')
    this._focusActiveCellAfterRender()
  }

  /** Moves the browsing position, keeping it within the boundaries. */
  protected _setActiveDate(date: D): void {
    this._activeDate.set(this._clampDate(date))
  }

  /** Moves the calendar to the previous month or year. */
  protected _previousClicked(): void {
    this._navigate(-1)
  }

  /** Moves the calendar to the next month or year. */
  protected _nextClicked(): void {
    this._navigate(1)
  }

  /** Moves the active date by the given amount of the current view's periods. */
  private _navigate(amount: number): void {
    switch (this._currentView()) {
      case 'year':
        return this._setActiveDate(
          this._dateAdapter.addCalendarYears(this._activeDate(), amount),
        )

      case 'multi-year':
        return this._setActiveDate(
          this._dateAdapter.addCalendarYears(
            this._activeDate(),
            amount * YEARS_PER_PAGE,
          ),
        )

      default:
        return this._setActiveDate(
          this._dateAdapter.addCalendarMonths(this._activeDate(), amount),
        )
    }
  }

  /** Keeps the date within the `[min, max]` range. */
  private _clampDate(date: D): D {
    return this._dateAdapter.clampDate(date, this._min(), this._max())
  }

  /**
   * Focuses the active cell of the current view once it's rendered. Keeps the
   * keyboard focus in the grid across view switches, which recreate the DOM.
   */
  private _focusActiveCellAfterRender(): void {
    afterNextRender(
      {
        read: () => {
          this._elementRef.nativeElement
            .querySelector<HTMLButtonElement>('button[data-active]')
            ?.focus()
        },
      },
      { injector: this._injector },
    )
  }
}
