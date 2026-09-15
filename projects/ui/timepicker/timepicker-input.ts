import {
  Directive,
  ElementRef,
  forwardRef,
  input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core'
import {
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidatorFn,
  Validators,
} from '@angular/forms'
import {
  CkDatepickerBase,
  CkDatepickerControl,
  CkDatepickerInputBase,
} from '@corekit/ui/datepicker'
import {
  maxTimeValidator,
  minTimeValidator,
  parseTimeValidator,
} from './timepicker-validators'

const CONTROL_VALUE_ACCESSOR_PROVIDER = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => CkTimepickerInput),
  multi: true,
}

const VALIDATOR_PROVIDER = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => CkTimepickerInput),
  multi: true,
}

/**
 * Directive connecting an input to a timepicker popup.
 *
 * The value is a date carrying the picked time: typing into the input moves
 * the time of the day the value already points at, leaving that day alone.
 */
@Directive({
  selector: 'input[ckTimepicker]',
  exportAs: 'ckTimepickerInput',
  providers: [CONTROL_VALUE_ACCESSOR_PROVIDER, VALIDATOR_PROVIDER],
  host: {
    '[attr.aria-haspopup]': '"dialog"',
    '[attr.aria-expanded]': 'timepicker().isOpen()',
    '[attr.aria-controls]': 'timepicker().isOpen() ? timepicker().id : null',
    '[disabled]': 'isDisabled()',
    '(input)': '_handleInput($event)',
    '(change)': '_handleChange()',
    '(blur)': '_handleBlur()',
    '(keydown)': '_handleKeydown($event)',
  },
})
export class CkTimepickerInput<D>
  extends CkDatepickerInputBase<D | null, D>
  implements OnInit, OnDestroy, CkDatepickerControl<D>
{
  /** The timepicker this input should control. */
  public readonly timepicker = input.required<
    CkDatepickerBase<CkDatepickerControl<D>, D | null, D>
  >({ alias: 'ckTimepicker' })

  /**
   * The earliest selectable time. Only its hour and minute are taken into
   * account, as the timepicker neither shows nor picks anything finer.
   */
  public readonly min = input<D | null>(null)

  /**
   * The latest selectable time. Only its hour and minute are taken into
   * account, as the timepicker neither shows nor picks anything finer.
   */
  public readonly max = input<D | null>(null)

  protected readonly _minDate = this.min
  protected readonly _maxDate = this.max

  /** A time falls on no day of its own, so there is nothing to filter. */
  protected readonly _dateFilter = signal<((date: D) => boolean) | null>(null)

  protected readonly _validator = Validators.compose(this._getValidators())

  public ngOnInit(): void {
    this._registerModel(this.timepicker()._registerInput(this))
  }

  public ngOnDestroy(): void {
    this.timepicker()._registerInput(null)
  }

  /** Opens the timepicker popup. */
  public open(): void {
    this.timepicker().open()
  }

  /** Closes the timepicker popup. */
  public close(): void {
    this.timepicker().close()
  }

  /** The time the popup opens at — the selected one. */
  public getStartValue(): D | null {
    return this.value()
  }

  /** Moves the focus into the input. */
  public focus(): void {
    this.host.nativeElement.focus()
  }

  /** Element the popup is anchored to — the input itself. */
  public getConnectedOverlayOrigin(): ElementRef<HTMLElement> {
    return this.host
  }

  /** A time is validated against the clock rather than the calendar. */
  protected override _getValidators(): ValidatorFn[] {
    return [
      parseTimeValidator(
        this.isParseValid,
        () => this.host.nativeElement.value,
      ),
      minTimeValidator(this._dateAdapter, () => this._minDate()),
      maxTimeValidator(this._dateAdapter, () => this._maxDate()),
    ]
  }

  /**
   * Reads the typed text as a clock reading and puts it on the day the value
   * already points at, or on today while there is no value yet.
   *
   * Typed seconds are dropped: the input never shows them, and a value that
   * differs from what it shows only by them would read as invalid for no
   * reason the user could see.
   */
  protected override _parseValue(text: string): D | null {
    const time = this._dateAdapter.parseTime(
      text,
      this._dateFormats.parse.timeInput,
    )

    if (!time || !this._dateAdapter.isValid(time)) return time

    return this._dateAdapter.setTime(
      this.value() ?? this._dateAdapter.today(),
      this._dateAdapter.getHours(time),
      this._dateAdapter.getMinutes(time),
      0,
    )
  }

  /** Two values are the same one when they are the same moment. */
  protected override _sameValue(first: D | null, second: D | null): boolean {
    return (
      this._dateAdapter.sameDate(first, second) &&
      this._dateAdapter.sameTime(first, second)
    )
  }

  /** The input renders the time of its value, never the day. */
  protected override _formatValue(date: D | null): void {
    this.host.nativeElement.value = date
      ? this._dateAdapter.format(date, this._dateFormats.display.timeInput)
      : ''
  }

  protected _getValueFromModel(selection: D | null): D | null {
    return selection
  }

  protected _assignValueToModel(date: D | null): void {
    this._model()?.updateSelection(date, this)
  }

  protected _openPopup(): void {
    this.timepicker().open()
  }
}
