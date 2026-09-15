import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
} from '@angular/core'
import { CkDateAdapter, CkHourFormat } from '@corekit/ui/core'
import { classNames } from '@corekit/ui/utils'
import { CkTimeList, CkTimeOption } from './time-list'
import {
  timeSelectorBandStyles,
  timeSelectorColumnStyles,
  timeSelectorHeaderStyles,
  timeSelectorSeparatorColumnStyles,
  timeSelectorSeparatorStyles,
  timeSelectorStyles,
} from './time-selector.styles'
import { CkTimepickerIntl } from './timepicker-intl'

/** Half of the day a reading of a 12-hour clock falls in. */
export type CkDayPeriod = 'am' | 'pm'

/**
 * Row of columns a time is picked in — the hour, the minute and, on a 12-hour
 * clock, the day period.
 *
 * A column lists only what the boundaries leave within reach, with one
 * exception: the value it is showing stays on the list even when the
 * boundaries have moved out from under it, so that the column always has
 * something to point at.
 *
 * The selector edits the time it is given and reports every change at once.
 * Whether those changes are worth keeping is up to whoever holds the value:
 * the timepicker popup, for one, only commits them once its footer says so.
 */
@Component({
  selector: 'ck-time-selector',
  exportAs: 'ckTimeSelector',
  imports: [CkTimeList],
  templateUrl: './time-selector.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': '_class' },
})
export class CkTimeSelector<D> {
  /** The time being edited. */
  public readonly value = model.required<D>()

  /**
   * Clock the columns are laid out on. Defaults to the one the locale keeps
   * time on.
   */
  public readonly hourFormat = input<CkHourFormat | null>(null)

  /**
   * The earliest selectable time. Only its hour and minute are taken into
   * account, as the columns pick nothing finer.
   */
  public readonly min = input<D | null>(null)

  /**
   * The latest selectable time. Only its hour and minute are taken into
   * account, as the columns pick nothing finer.
   */
  public readonly max = input<D | null>(null)

  protected readonly _intl = inject(CkTimepickerIntl)

  protected readonly _class = classNames(timeSelectorStyles)
  protected readonly _bandClass = classNames(timeSelectorBandStyles)
  protected readonly _headerClass = classNames(timeSelectorHeaderStyles)
  protected readonly _separatorClass = classNames(timeSelectorSeparatorStyles)

  protected readonly _columnClass = classNames(
    timeSelectorColumnStyles({ content: 'digits' }),
  )

  protected readonly _dayPeriodColumnClass = classNames(
    timeSelectorColumnStyles({ content: 'dayPeriod' }),
  )

  protected readonly _separatorColumnClass = classNames(
    timeSelectorSeparatorColumnStyles,
  )

  private readonly _dateAdapter = inject<CkDateAdapter<D>>(CkDateAdapter)

  /** The clock in use, the locale's own unless one was asked for. */
  protected readonly _hourFormat = computed(() => {
    return this.hourFormat() ?? this._dateAdapter.getHourFormat()
  })

  /**
   * Names of the hours on the clock in use. The locale renders each of them
   * separately, so they are read once per clock instead of every time the
   * value moves and the columns are filtered again.
   */
  private readonly _hourNames = computed(() => {
    return this._dateAdapter.getHourNames(this._hourFormat())
  })

  /** Names of the minutes, the same on either clock, so read only once. */
  private readonly _minuteNames = computed(() => {
    return this._dateAdapter.getMinuteNames()
  })

  /** Names of the day periods, read only once. */
  private readonly _dayPeriodNames = computed(() => {
    return this._dateAdapter.getDayPeriodNames()
  })

  protected readonly _hourOptions = computed<Array<CkTimeOption<number>>>(
    () => {
      const hourFormat = this._hourFormat()
      const dayPeriod = this._dayPeriod()
      const hour = this._hour()

      return this._hourNames()
        .map((label, index) => ({
          // A 12-hour clock opens at 12 and counts 1 … 11 from there.
          value: hourFormat === '12h' && index === 0 ? 12 : index,
          label,
        }))
        .filter(option => {
          const hours = this._toHoursOfDay(option.value, dayPeriod)

          // An hour is within reach while any of its minutes is: its last
          // minute must not fall before the minimum, nor its first after the
          // maximum.
          return (
            option.value === hour ||
            (this._isAfterMin(hours, 59) && this._isBeforeMax(hours, 0))
          )
        })
    },
  )

  protected readonly _minuteOptions = computed<Array<CkTimeOption<number>>>(
    () => {
      const hours = this._dateAdapter.getHours(this.value())
      const minute = this._minute()

      return this._minuteNames()
        .map((label, value) => ({ value, label }))
        .filter(
          option =>
            option.value === minute ||
            (this._isAfterMin(hours, option.value) &&
              this._isBeforeMax(hours, option.value)),
        )
    },
  )

  protected readonly _dayPeriodOptions = computed<
    Array<CkTimeOption<CkDayPeriod>>
  >(() => {
    const [am, pm] = this._dayPeriodNames()
    const dayPeriod = this._dayPeriod()

    // A half of the day is within reach while any of its hours is, the same
    // way an hour is while any of its minutes is.
    const isMorningAvailable =
      this._isAfterMin(11, 59) && this._isBeforeMax(0, 0)

    const isAfternoonAvailable =
      this._isAfterMin(23, 59) && this._isBeforeMax(12, 0)

    const options: Array<CkTimeOption<CkDayPeriod>> = []

    if (isMorningAvailable || dayPeriod === 'am') {
      options.push({ value: 'am', label: am })
    }

    if (isAfternoonAvailable || dayPeriod === 'pm') {
      options.push({ value: 'pm', label: pm })
    }

    return options
  })

  /** The hour as its column spells it, which a 12-hour clock counts to 12. */
  protected readonly _hour = computed(() => {
    const hours = this._dateAdapter.getHours(this.value())

    if (this._hourFormat() === '24h') return hours

    return hours % 12 === 0 ? 12 : hours % 12
  })

  protected readonly _minute = computed(() => {
    return this._dateAdapter.getMinutes(this.value())
  })

  protected readonly _dayPeriod = computed<CkDayPeriod>(() => {
    return this._dateAdapter.getHours(this.value()) < 12 ? 'am' : 'pm'
  })

  protected _hourChanged(hour: number): void {
    this._setTime(this._toHoursOfDay(hour, this._dayPeriod()), this._minute())
  }

  protected _minuteChanged(minute: number): void {
    this._setTime(this._dateAdapter.getHours(this.value()), minute)
  }

  protected _dayPeriodChanged(dayPeriod: CkDayPeriod): void {
    this._setTime(this._toHoursOfDay(this._hour(), dayPeriod), this._minute())
  }

  /**
   * Writes the time back, leaving the day it falls on alone.
   *
   * A column can step past a boundary: switching the day period carries the
   * hour with it, and an hour at either end of the range only lets some of
   * its minutes through. Each part is pulled back on its own, so that a part
   * the boundaries still allow is left where it is.
   */
  private _setTime(hours: number, minutes: number): void {
    const clampedHours = this._clampHours(hours)

    this.value.set(
      this._dateAdapter.setTime(
        this.value(),
        clampedHours,
        this._clampMinutes(clampedHours, minutes),
        0,
      ),
    )
  }

  /** Pulls an hour into the hours the boundaries leave open. */
  private _clampHours(hours: number): number {
    const min = this.min()
    const max = this.max()
    const earliest = min ? this._dateAdapter.getHours(min) : 0
    const latest = max ? this._dateAdapter.getHours(max) : 23

    return Math.min(Math.max(hours, earliest), latest)
  }

  /**
   * Pulls a minute into the minutes the hour it belongs to leaves open. Only
   * the hours the boundaries themselves fall on are cut short.
   */
  private _clampMinutes(hours: number, minutes: number): number {
    const min = this.min()
    const max = this.max()

    const earliest =
      min && hours === this._dateAdapter.getHours(min)
        ? this._dateAdapter.getMinutes(min)
        : 0

    const latest =
      max && hours === this._dateAdapter.getHours(max)
        ? this._dateAdapter.getMinutes(max)
        : 59

    return Math.min(Math.max(minutes, earliest), latest)
  }

  /** Whether a clock reading is no earlier than the minimum. */
  private _isAfterMin(hours: number, minutes: number): boolean {
    const min = this.min()

    return !min || this._compare(hours, minutes, min) >= 0
  }

  /** Whether a clock reading is no later than the maximum. */
  private _isBeforeMax(hours: number, minutes: number): boolean {
    const max = this.max()

    return !max || this._compare(hours, minutes, max) <= 0
  }

  /**
   * Compares a clock reading with a boundary, down to the minute. Anything
   * finer is of no use here: the columns commit whole minutes.
   */
  private _compare(hours: number, minutes: number, boundary: D): number {
    return (
      hours - this._dateAdapter.getHours(boundary) ||
      minutes - this._dateAdapter.getMinutes(boundary)
    )
  }

  /**
   * Converts an hour of the column to the hour of the day it stands for. On a
   * 24-hour clock the two are already the same.
   */
  private _toHoursOfDay(hour: number, dayPeriod: CkDayPeriod): number {
    if (this._hourFormat() === '24h') return hour

    // Noon and midnight are both spelled 12, and only one of them is 12 on a
    // 24-hour clock.
    const morningHour = hour % 12

    return dayPeriod === 'pm' ? morningHour + 12 : morningHour
  }
}
