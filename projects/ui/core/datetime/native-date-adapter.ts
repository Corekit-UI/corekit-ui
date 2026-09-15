import { inject, Injectable } from '@angular/core'

import { CkDateAdapter, CkDateNameStyle, CkHourFormat } from './date-adapter'
import { CK_DATE_LOCALE } from './date-locale'

/** Matches strings that have the form of a valid ISO 8601 string. */
const ISO_8601_REGEX =
  /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|(?:(?:\+|-)\d{2}:\d{2}))?)?$/u

/** Matches an ISO 8601 string carrying a date without a time. */
const ISO_8601_DATE_REGEX = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/u

/**
 * Matches a time, e.g. `2:30 PM`, `14.30` or `2pm`.
 *
 * Both the minutes and the seconds are optional — a bare hour is a complete
 * time to a person typing one.
 */
const TIME_REGEX =
  /^(?<hours>\d?\d)(?:[:.](?<minutes>\d?\d))?(?:[:.](?<seconds>\d?\d))?\s*(?<dayPeriod>AM|PM)?$/iu

/**
 * Matches a run of anything a time is not, e.g. the `h` in `14h30`, the space
 * in `14 30` or the `ч.` bulgarian appends. Separators are part of the run, so
 * that however many of them there are, a single one is put back.
 */
const TIME_NOISE_REGEX = /[^\dapm]+/giu

/** Matches a separator the noise left in front of a day period, `2:30:pm`. */
const SEPARATOR_BEFORE_DAY_PERIOD_REGEX = /:(?=[ap])/giu

/** Matches the separators the noise left at either end, `:14:30:`. */
const DANGLING_SEPARATORS_REGEX = /^:+|:+$/gu

/** Creates an array of the given length filled by the value factory. */
function range<T>(length: number, valueFactory: (index: number) => T): T[] {
  return Array.from({ length }, (_, index) => valueFactory(index))
}

/** `CkDateAdapter` implementation based on the native JavaScript `Date`. */
@Injectable({ providedIn: 'root' })
export class CkNativeDateAdapter extends CkDateAdapter<Date> {
  private readonly _locale = inject(CK_DATE_LOCALE)

  /**
   * Names of the day periods, once they have been read. Every attempt to parse
   * a time asks for them, and the locale cannot change under an adapter, so
   * there is no reason to render them again.
   */
  private _dayPeriodNames: [string, string] | null = null

  public getYear(date: Date): number {
    return date.getFullYear()
  }

  public getMonth(date: Date): number {
    return date.getMonth()
  }

  public getDate(date: Date): number {
    return date.getDate()
  }

  public getDayOfWeek(date: Date): number {
    return date.getDay()
  }

  public getHours(date: Date): number {
    return date.getHours()
  }

  public getMinutes(date: Date): number {
    return date.getMinutes()
  }

  public getSeconds(date: Date): number {
    return date.getSeconds()
  }

  public getMonthNames(style: CkDateNameStyle): string[] {
    const format = new Intl.DateTimeFormat(this._locale, {
      month: style,
      timeZone: 'utc',
    })

    return range(12, month => {
      return format.format(new Date(Date.UTC(2017, month, 1)))
    })
  }

  public getDateNames(): string[] {
    const format = new Intl.DateTimeFormat(this._locale, {
      day: 'numeric',
      timeZone: 'utc',
    })

    return range(31, date =>
      format.format(new Date(Date.UTC(2017, 0, date + 1))),
    )
  }

  public getDayOfWeekNames(style: CkDateNameStyle): string[] {
    const format = new Intl.DateTimeFormat(this._locale, {
      weekday: style,
      timeZone: 'utc',
    })

    // January 1st, 2017 was a Sunday.
    return range(7, day => format.format(new Date(Date.UTC(2017, 0, day + 1))))
  }

  public getDayPeriodNames(): [string, string] {
    this._dayPeriodNames ??= this._readDayPeriodNames()

    const [am, pm] = this._dayPeriodNames

    // A copy, so that no caller can change what the next one reads.
    return [am, pm]
  }

  public getHourNames(hourFormat: CkHourFormat): string[] {
    const isTwelveHour = hourFormat === '12h'

    const format = new Intl.DateTimeFormat(this._locale, {
      // Locales and even engines disagree on whether a 24-hour clock pads its
      // hours, so it is asked to, which lines them up with the minutes. A
      // 12-hour clock reads `9 AM`, never `09 AM`.
      hour: isTwelveHour ? 'numeric' : '2-digit',
      hourCycle: isTwelveHour ? 'h12' : 'h23',
      timeZone: 'utc',
    })

    // A 12-hour clock reads 12, 1, 2 …, so it starts at noon. Asking for the
    // hour alone also brings the day period along, hence reading the part.
    const firstHour = isTwelveHour ? 12 : 0

    return range(isTwelveHour ? 12 : 24, index =>
      this._getTimePart(format, this._timeAt(firstHour + index), 'hour'),
    )
  }

  public getMinuteNames(): string[] {
    // A minute asked for on its own comes out unpadded, so it is read off a
    // whole clock reading instead.
    const format = new Intl.DateTimeFormat(this._locale, {
      hour: 'numeric',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: 'utc',
    })

    return range(60, minute =>
      this._getTimePart(format, this._timeAt(0, minute), 'minute'),
    )
  }

  public getYearName(date: Date): string {
    const format = new Intl.DateTimeFormat(this._locale, {
      year: 'numeric',
      timeZone: 'utc',
    })

    return format.format(this._toUtcDate(date))
  }

  public getFirstDayOfWeek(): number {
    const locale = new Intl.Locale(this._locale) as Intl.Locale & {
      getWeekInfo?(): { firstDay: number }
      weekInfo?: { firstDay: number }
    }

    // Some browsers implement a `getWeekInfo` method while others have a
    // `weekInfo` getter, and some support neither.
    const firstDay = (locale.getWeekInfo?.() ?? locale.weekInfo)?.firstDay ?? 0

    // `firstDay` is 1-based where 1 is Monday and 7 is Sunday, whereas our
    // representation is 0-based starting from Sunday.
    return firstDay % 7
  }

  public getHourFormat(): CkHourFormat {
    const { hourCycle, hour12 } = new Intl.DateTimeFormat(this._locale, {
      hour: 'numeric',
    }).resolvedOptions()

    // `Intl` also reports the cycles that number midnight `0` and `24`, which
    // no clock face shows: each folds into the clock it belongs to.
    // `hourCycle` itself is only absent on engines that predate it, which
    // still resolve the `hour12` flag it superseded.
    const isTwelveHour = hourCycle
      ? hourCycle === 'h11' || hourCycle === 'h12'
      : Boolean(hour12)

    return isTwelveHour ? '12h' : '24h'
  }

  public getNumDaysInMonth(date: Date): number {
    return this.getDate(
      this._createDateWithOverflow(
        this.getYear(date),
        this.getMonth(date) + 1,
        0,
      ),
    )
  }

  public createDate(year: number, month: number, date: number): Date {
    if (month < 0 || month > 11) {
      throw Error(
        `Invalid month index "${month}". Month index has to be between 0 and 11.`,
      )
    }

    if (date < 1) {
      throw Error(`Invalid date "${date}". Date has to be greater than 0.`)
    }

    const result = this._createDateWithOverflow(year, month, date)

    if (result.getMonth() !== month) {
      throw Error(`Invalid date "${date}" for month with index "${month}".`)
    }

    return result
  }

  public setTime(
    date: Date,
    hours: number,
    minutes: number,
    seconds: number,
  ): Date {
    if (hours < 0 || hours > 23) {
      throw Error(
        `Invalid hours "${hours}". Hours have to be between 0 and 23.`,
      )
    }

    if (minutes < 0 || minutes > 59) {
      throw Error(
        `Invalid minutes "${minutes}". Minutes have to be between 0 and 59.`,
      )
    }

    if (seconds < 0 || seconds > 59) {
      throw Error(
        `Invalid seconds "${seconds}". Seconds have to be between 0 and 59.`,
      )
    }

    const result = new Date(date.getTime())

    result.setHours(hours, minutes, seconds, 0)

    return result
  }

  public today(): Date {
    return new Date()
  }

  /**
   * Parses a date from a user-provided value.
   *
   * The native `Date` has no way to customize the parse format or locale, so
   * `parseFormat` is ignored and parsing is delegated to `Date.parse`.
   */
  public parse(value: unknown): Date | null {
    if (typeof value === 'number') return new Date(value)

    return value ? new Date(Date.parse(value as string)) : null
  }

  /**
   * Parses a time from a user-provided value.
   *
   * The native `Date` has no way to customize the parse format or locale, so
   * `parseFormat` is ignored and the value is read as a clock reading, which
   * `Date.parse` cannot do on its own.
   *
   * @returns The time on today's date, as the day it falls on carries no
   * meaning here.
   */
  public parseTime(value: unknown): Date | null {
    // Anything that isn't text has a date in it as well, e.g. a timestamp.
    if (typeof value !== 'string') return this.parse(value)

    const text = value.trim()

    if (!text) return null

    // A value written some other way, e.g. `14h30` or `14:30 ч.`, is a time
    // all the same, so it gets a second chance in the plain form. A localized
    // day period does not survive the rewrite, hence the first attempt.
    const parsed =
      this._parseTimeString(text) ??
      this._parseTimeString(
        text
          .replace(TIME_NOISE_REGEX, ':')
          .replace(SEPARATOR_BEFORE_DAY_PERIOD_REGEX, '')
          .replace(DANGLING_SEPARATORS_REGEX, ''),
      )

    return parsed ?? this.invalid()
  }

  public format(date: Date, displayFormat: Intl.DateTimeFormatOptions): string {
    if (!this.isValid(date)) {
      throw Error('CkNativeDateAdapter: Cannot format invalid date.')
    }

    const format = new Intl.DateTimeFormat(this._locale, {
      ...displayFormat,
      timeZone: 'utc',
    })

    return format.format(this._toUtcDate(date))
  }

  public addCalendarYears(date: Date, years: number): Date {
    return this.addCalendarMonths(date, years * 12)
  }

  public addCalendarMonths(date: Date, months: number): Date {
    let newDate = this._createDateWithOverflow(
      this.getYear(date),
      this.getMonth(date) + months,
      this.getDate(date),
    )

    // It's possible to wind up in the wrong month if the original month has
    // more days than the new month. In this case we want to go to the last day
    // of the desired month.
    if (
      this.getMonth(newDate) !==
      (((this.getMonth(date) + months) % 12) + 12) % 12
    ) {
      newDate = this._createDateWithOverflow(
        this.getYear(newDate),
        this.getMonth(newDate),
        0,
      )
    }

    return newDate
  }

  public addCalendarDays(date: Date, days: number): Date {
    return this._createDateWithOverflow(
      this.getYear(date),
      this.getMonth(date),
      this.getDate(date) + days,
    )
  }

  public isDateInstance(value: unknown): value is Date {
    return value instanceof Date
  }

  public isValid(date: Date): boolean {
    return !isNaN(date.getTime())
  }

  public invalid(): Date {
    return new Date(NaN)
  }

  /**
   * Converts a value into a date, accepting ISO 8601 strings.
   *
   * Unlike the plain `Date` constructor, a string without a time is read as a
   * local calendar day rather than UTC midnight — see {@link _parseIsoDate}.
   */
  public override deserialize(value: unknown): Date | null {
    if (typeof value === 'string') {
      if (!value) return null

      const localDate = this._parseIsoDate(value)

      if (localDate) return localDate

      // The `Date` constructor accepts formats other than ISO 8601, so we only
      // pass it values that strictly look like ISO strings to avoid deserializing
      // arbitrary garbage.
      if (ISO_8601_REGEX.test(value)) {
        const date = new Date(value)

        if (this.isValid(date)) return date
      }
    }

    return super.deserialize(value)
  }

  /**
   * Reads a time-less ISO 8601 string as a local date.
   *
   * The `Date` constructor treats such strings as UTC midnight, which lands on
   * the previous day in negative offset timezones. A calendar day carries no
   * timezone, so it's kept as typed.
   *
   * @returns The date, or `null` if the string isn't a time-less ISO 8601 one.
   */
  private _parseIsoDate(value: string): Date | null {
    const groups = ISO_8601_DATE_REGEX.exec(value)?.groups

    if (!groups) return null

    const year = Number(groups['year'])
    const month = Number(groups['month']) - 1
    const day = Number(groups['day'])
    const date = this._createDateWithOverflow(year, month, day)

    // Rejects values like `2026-13-45`, which would silently overflow into
    // another month.
    const isExactDate =
      this.getYear(date) === year &&
      this.getMonth(date) === month &&
      this.getDate(date) === day

    return isExactDate ? date : null
  }

  /**
   * Reads a clock reading, e.g. `2:30 PM`, into a time on today's date.
   *
   * @returns The time, or `null` if the string isn't a clock reading.
   */
  private _parseTimeString(value: string): Date | null {
    const { text, dayPeriod } = this._splitDayPeriod(value)
    const groups = TIME_REGEX.exec(text)?.groups

    if (!groups) return null

    const hours = this._toHours24(
      Number(groups['hours']),
      groups['dayPeriod'] ?? dayPeriod,
    )
    const minutes = Number(groups['minutes'] ?? 0)
    const seconds = Number(groups['seconds'] ?? 0)

    // The pattern only admits digits, so the values can only run too high,
    // e.g. `25:00` or `13 PM`.
    const isInRange = hours <= 23 && minutes <= 59 && seconds <= 59

    return isInRange
      ? this.setTime(this.today(), hours, minutes, seconds)
      : null
  }

  /** Renders the names of the day periods, before and after noon. */
  private _readDayPeriodNames(): [string, string] {
    // A locale that keeps 24-hour time still has names for the day periods,
    // so the 12-hour clock is asked for explicitly.
    const format = new Intl.DateTimeFormat(this._locale, {
      hour: 'numeric',
      hour12: true,
      timeZone: 'utc',
    })

    return [
      this._getTimePart(format, this._timeAt(0), 'dayPeriod'),
      this._getTimePart(format, this._timeAt(13), 'dayPeriod'),
    ]
  }

  /** A date at the given time of day, used to render the names of its parts. */
  private _timeAt(hours: number, minutes = 0): Date {
    return new Date(Date.UTC(2017, 0, 1, hours, minutes))
  }

  /** Reads one part out of a formatted time, e.g. its hour. */
  private _getTimePart(
    format: Intl.DateTimeFormat,
    date: Date,
    type: Intl.DateTimeFormatPartTypes,
  ): string {
    return (
      format.formatToParts(date).find(part => part.type === type)?.value ?? ''
    )
  }

  /**
   * Splits a localized day period off a time, e.g. the `오후` in `오후 2:30`, which
   * the pattern only knows in its English spelling.
   */
  private _splitDayPeriod(value: string): {
    text: string
    dayPeriod: string | undefined
  } {
    const [am, pm] = this.getDayPeriodNames()
    const lowercased = value.toLowerCase()

    for (const [name, dayPeriod] of [
      [pm, 'PM'],
      [am, 'AM'],
    ] as const) {
      const index = name ? lowercased.indexOf(name.toLowerCase()) : -1

      if (index !== -1) {
        const text = value.slice(0, index) + value.slice(index + name.length)

        return { text: text.trim(), dayPeriod }
      }
    }

    return { text: value, dayPeriod: undefined }
  }

  /**
   * Converts an hour of a 12-hour clock to a 24-hour one. An hour typed
   * without a day period is already a 24-hour one.
   */
  private _toHours24(hours: number, dayPeriod: string | undefined): number {
    if (!dayPeriod) return hours

    const isAfternoon = dayPeriod.toUpperCase() === 'PM'

    // Noon and midnight are both spelled `12`, and only one of them is `12`
    // on a 24-hour clock.
    if (hours === 12) return isAfternoon ? 12 : 0

    return isAfternoon ? hours + 12 : hours
  }

  /**
   * Creates a date, allowing out-of-range values to overflow into the adjacent
   * months/years, e.g. month `12` becomes January of the next year.
   */
  private _createDateWithOverflow(
    year: number,
    month: number,
    date: number,
  ): Date {
    const result = new Date()

    result.setFullYear(year, month, date)
    result.setHours(0, 0, 0, 0)

    return result
  }

  /**
   * Returns a copy of the date shifted so its local values become UTC values.
   * Used before formatting with a UTC-based `Intl.DateTimeFormat`, which
   * prevents the formatted value from drifting a day around DST changes.
   *
   * The time is carried over as well, so that a format asking for it gets the
   * time the date actually holds rather than midnight.
   */
  private _toUtcDate(date: Date): Date {
    const utcDate = new Date()

    utcDate.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate())
    utcDate.setUTCHours(
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds(),
    )

    return utcDate
  }
}
