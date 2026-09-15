import {
  Directive,
  ElementRef,
  forwardRef,
  input,
  OnDestroy,
  OnInit,
} from '@angular/core'
import { NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators } from '@angular/forms'
import { CkDatepickerBase } from './datepicker-base'
import { CkDatepickerControl } from './datepicker-control'
import { CkDatepickerInputBase } from './datepicker-input-base'

const CONTROL_VALUE_ACCESSOR_PROVIDER = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => CkDatepickerInput),
  multi: true,
}

const VALIDATOR_PROVIDER = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => CkDatepickerInput),
  multi: true,
}

/**
 * Directive connecting an input to a datepicker popup.
 *
 * The input is for manual typing — the popup is opened with the
 * `CkDatepickerToggle` button or programmatically, and is anchored to this
 * input.
 */
@Directive({
  selector: 'input[ckDatepicker]',
  exportAs: 'ckDatepickerInput',
  providers: [CONTROL_VALUE_ACCESSOR_PROVIDER, VALIDATOR_PROVIDER],
  host: {
    '[attr.aria-haspopup]': '"dialog"',
    '[attr.aria-expanded]': 'datepicker().isOpen()',
    '[attr.aria-controls]': 'datepicker().isOpen() ? datepicker().id : null',
    '[disabled]': 'isDisabled()',
    '(input)': '_handleInput($event)',
    '(change)': '_handleChange()',
    '(blur)': '_handleBlur()',
    '(keydown)': '_handleKeydown($event)',
  },
})
export class CkDatepickerInput<D>
  extends CkDatepickerInputBase<D | null, D>
  implements OnInit, OnDestroy, CkDatepickerControl<D>
{
  /** The datepicker this input should control. */
  public readonly datepicker = input.required<
    CkDatepickerBase<CkDatepickerControl<D>, D | null, D>
  >({ alias: 'ckDatepicker' })

  /** The minimum selectable date. */
  public readonly min = input<D | null>(null)

  /** The maximum selectable date. */
  public readonly max = input<D | null>(null)

  /** Function disabling arbitrary dates, e.g. weekends. */
  public readonly dateFilter = input<((date: D) => boolean) | null>(null, {
    alias: 'ckDatepickerFilter',
  })

  protected readonly _minDate = this.min
  protected readonly _maxDate = this.max
  protected readonly _dateFilter = this.dateFilter
  protected readonly _validator = Validators.compose(this._getValidators())

  public ngOnInit(): void {
    this._registerModel(this.datepicker()._registerInput(this))
  }

  public ngOnDestroy(): void {
    this.datepicker()._registerInput(null)
  }

  /** Opens the datepicker popup. */
  public open(): void {
    this.datepicker().open()
  }

  /** Closes the datepicker popup. */
  public close(): void {
    this.datepicker().close()
  }

  /** The date the calendar opens at — the selected one. */
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

  protected _getValueFromModel(selection: D | null): D | null {
    return selection
  }

  protected _assignValueToModel(date: D | null): void {
    this._model()?.updateSelection(date, this)
  }

  protected _openPopup(): void {
    this.datepicker().open()
  }
}
