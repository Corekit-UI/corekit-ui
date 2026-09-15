/** Style of a month or a weekday name. */
export type CkDateNameStyle = 'long' | 'short' | 'narrow'

/**
 * Clock a time is shown on — hours running `1–12` next to a day period, or
 * `0–23` on their own.
 */
export type CkHourFormat = '12h' | '24h'

/**
 * Adapts a date implementation (native `Date`, Luxon, Day.js etc.) for use with
 * date-aware components such as the datepicker.
 *
 * Months and weekdays are 0-based: January and Sunday are `0`.
 */
export abstract class CkDateAdapter<D> {
  /** Gets the year of the given date. */
  public abstract getYear(date: D): number

  /** Gets the 0-based month of the given date. */
  public abstract getMonth(date: D): number

  /** Gets the day of the month of the given date, starting at `1`. */
  public abstract getDate(date: D): number

  /** Gets the 0-based day of the week of the given date. Sunday is `0`. */
  public abstract getDayOfWeek(date: D): number

  /** Gets the hour of the given date, from `0` to `23`. */
  public abstract getHours(date: D): number

  /** Gets the minute of the given date, from `0` to `59`. */
  public abstract getMinutes(date: D): number

  /** Gets the second of the given date, from `0` to `59`. */
  public abstract getSeconds(date: D): number

  /** Gets a list of month names, starting with January. */
  public abstract getMonthNames(style: CkDateNameStyle): string[]

  /** Gets a list of names of the days of the month, starting with `'1'`. */
  public abstract getDateNames(): string[]

  /** Gets a list of weekday names, starting with Sunday. */
  public abstract getDayOfWeekNames(style: CkDateNameStyle): string[]

  /** Gets the names of the day periods, before and after noon. */
  public abstract getDayPeriodNames(): [string, string]

  /**
   * Gets a list of hour names, starting at the first hour the clock shows —
   * `12` on a 12-hour clock, `00` on a 24-hour one. The hours of a 24-hour
   * clock take two digits, like the minutes they are read together with.
   */
  public abstract getHourNames(hourFormat: CkHourFormat): string[]

  /** Gets a list of minute names, starting with `'00'`. */
  public abstract getMinuteNames(): string[]

  /** Gets the name of the year of the given date, e.g. `'2026'`. */
  public abstract getYearName(date: D): string

  /** Gets the first day of the week. Sunday is `0`. */
  public abstract getFirstDayOfWeek(): number

  /** Gets the clock the locale keeps time on. */
  public abstract getHourFormat(): CkHourFormat

  /** Gets the number of days in the month of the given date. */
  public abstract getNumDaysInMonth(date: D): number

  /**
   * Creates a date with the given year, 0-based month and day of the month.
   *
   * @throws If the passed values are out of their valid ranges.
   */
  public abstract createDate(year: number, month: number, date: number): D

  /**
   * Sets the time of the given date, leaving the day it falls on alone.
   *
   * @returns A new date — the given one is left untouched.
   * @throws If the passed values are out of their valid ranges.
   */
  public abstract setTime(
    date: D,
    hours: number,
    minutes: number,
    seconds: number,
  ): D

  /** Gets today's date. */
  public abstract today(): D

  /**
   * Parses a date from a user-provided value.
   *
   * @param value The value to parse.
   * @param parseFormat The expected format of the value, defined by the
   * `CK_DATE_FORMATS` in use.
   * @returns The parsed date, an invalid date if the value looked like a date
   * but could not be parsed, or `null` if the value is empty.
   */
  public abstract parse(value: unknown, parseFormat: unknown): D | null

  /**
   * Parses a time from a user-provided value.
   *
   * Only the time of the result carries meaning — the day it lands on is up to
   * the adapter, and putting the time on the right day is up to the caller.
   *
   * @param value The value to parse.
   * @param parseFormat The expected format of the value, defined by the
   * `CK_DATE_FORMATS` in use.
   * @returns The parsed time, an invalid date if the value looked like a time
   * but could not be parsed, or `null` if the value is empty.
   */
  public abstract parseTime(value: unknown, parseFormat: unknown): D | null

  /**
   * Formats a date as a string.
   *
   * @param date A valid date.
   * @param displayFormat The format to use, defined by the `CK_DATE_FORMATS`
   * in use.
   */
  public abstract format(date: D, displayFormat: unknown): string

  /** Adds the given number of calendar years to the date. */
  public abstract addCalendarYears(date: D, years: number): D

  /**
   * Adds the given number of calendar months to the date, clamping the day of
   * the month so the result stays within the target month.
   */
  public abstract addCalendarMonths(date: D, months: number): D

  /** Adds the given number of calendar days to the date. */
  public abstract addCalendarDays(date: D, days: number): D

  /** Whether the given value is an instance of this adapter's date type. */
  public abstract isDateInstance(value: unknown): value is D

  /** Whether the given date is valid. */
  public abstract isValid(date: D): boolean

  /** Gets a date instance that is considered invalid. */
  public abstract invalid(): D

  /**
   * Attempts to convert a value coming from outside the adapter (e.g. set
   * programmatically on a form control) to a date.
   *
   * @returns The value itself if it's a valid date or `null`, an invalid date
   * otherwise. Override to support additional formats, e.g. ISO 8601 strings.
   */
  public deserialize(value: unknown): D | null {
    if (value === null || (this.isDateInstance(value) && this.isValid(value))) {
      return value
    }

    return this.invalid()
  }

  /**
   * Compares two dates by their year, month and day of the month.
   *
   * @returns A negative number if the first date is earlier, a positive number
   * if it's later and `0` if the dates are the same.
   */
  public compareDate(first: D, second: D): number {
    return (
      this.getYear(first) - this.getYear(second) ||
      this.getMonth(first) - this.getMonth(second) ||
      this.getDate(first) - this.getDate(second)
    )
  }

  /**
   * Whether two dates represent the same calendar day.
   *
   * Two `null` dates are considered the same, and so are two invalid ones —
   * neither points at a day, so there is nothing to tell apart.
   */
  public sameDate(first: D | null, second: D | null): boolean {
    if (!first || !second) return first === second

    const firstValid = this.isValid(first)

    return (
      firstValid === this.isValid(second) &&
      (!firstValid || !this.compareDate(first, second))
    )
  }

  /**
   * Compares two dates by their hours, minutes and seconds, ignoring the day
   * they fall on.
   *
   * @returns A negative number if the first time is earlier, a positive number
   * if it's later and `0` if the times are the same.
   */
  public compareTime(first: D, second: D): number {
    return (
      this.getHours(first) - this.getHours(second) ||
      this.getMinutes(first) - this.getMinutes(second) ||
      this.getSeconds(first) - this.getSeconds(second)
    )
  }

  /**
   * Whether two dates point at the same time of day, no matter which day they
   * fall on.
   *
   * Two `null` dates are considered the same, and so are two invalid ones —
   * neither points at a time, so there is nothing to tell apart.
   */
  public sameTime(first: D | null, second: D | null): boolean {
    if (!first || !second) return first === second

    const firstValid = this.isValid(first)

    return (
      firstValid === this.isValid(second) &&
      (!firstValid || !this.compareTime(first, second))
    )
  }

  /** Clamps the date so it stays between the given boundaries, if provided. */
  public clampDate(date: D, min?: D | null, max?: D | null): D {
    if (min && this.compareDate(date, min) < 0) return min
    if (max && this.compareDate(date, max) > 0) return max

    return date
  }

  /** Gets the given value if it's a valid date, `null` otherwise. */
  public getValidDateOrNull(value: unknown): D | null {
    return this.isDateInstance(value) && this.isValid(value) ? value : null
  }
}
