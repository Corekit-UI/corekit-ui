import { DOWN_ARROW, hasModifierKey } from '@angular/cdk/keycodes'
import { _getEventTarget } from '@angular/cdk/platform'
import {
  booleanAttribute,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  Signal,
  untracked,
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Subscription } from 'rxjs'
import {
  AbstractControl,
  ControlValueAccessor,
  ValidationErrors,
  Validator,
  ValidatorFn,
} from '@angular/forms'
import { CK_DATE_FORMATS, CkDateAdapter } from '@corekit/ui/core'
import {
  CkDateSelectionChange,
  CkDateSelectionModel,
} from './date-selection-model'
import {
  dateFilterValidator,
  maxDateValidator,
  minDateValidator,
  parseDateValidator,
} from './datepicker-validators'

/**
 * Base of the inputs a date can be typed into.
 *
 * Owns what every date input does the same way — parsing and formatting the
 * typed text, talking to the form control and validating the value — while
 * subclasses decide which part of the selection they hold: `S` is the shape of
 * the whole selection, `D` is the date type.
 */
@Directive()
export abstract class CkDatepickerInputBase<S, D>
  implements ControlValueAccessor, Validator
{
  /** Whether the input is disabled. */
  public readonly disabled = input(false, { transform: booleanAttribute })

  /** Event emitted every time the typed value is parsed into a date. */
  public readonly dateInput = output<D | null>()

  /**
   * Event emitted when the value is committed — a date is picked in the
   * calendar or the typed value fires a native `change` event.
   */
  public readonly dateChange = output<D | null>()

  /** The date this input holds. */
  public readonly value = computed(() => {
    const model = this._model()

    return model ? this._getValueFromModel(model.selection()) : null
  })

  /**
   * Whether the input is disabled by its own binding, by its form control or
   * by whatever it belongs to.
   */
  public readonly isDisabled = computed(() => {
    return (
      this.disabled() || this._isDisabledByForm() || this._isDisabledByParent()
    )
  })

  /**
   * Whether the typed value could be parsed into a date. Consumed by the
   * parse validator.
   */
  public readonly isParseValid = computed(() => this._isParseValid())

  /** HTML Element of the input. */
  public readonly host = inject<ElementRef<HTMLInputElement>>(ElementRef)

  protected readonly _dateAdapter = inject<CkDateAdapter<D>>(CkDateAdapter)
  protected readonly _dateFormats = inject(CK_DATE_FORMATS)

  /**
   * Selection state shared with the datepicker. Only available once the
   * datepicker is resolved, hence the signal.
   */
  protected readonly _model = signal<CkDateSelectionModel<S, D> | null>(null)

  /** The minimum selectable date, wherever the input takes it from. */
  protected abstract readonly _minDate: Signal<D | null>

  /** The maximum selectable date, wherever the input takes it from. */
  protected abstract readonly _maxDate: Signal<D | null>

  /** Function disabling arbitrary dates, wherever the input takes it from. */
  protected abstract readonly _dateFilter: Signal<((date: D) => boolean) | null>

  /**
   * Validators of the input. Assembled by the subclass, as it can add its own
   * on top of {@link _getValidators `_getValidators()`}.
   */
  protected abstract readonly _validator: ValidatorFn | null

  private readonly _destroyRef = inject(DestroyRef)
  private readonly _isParseValid = signal(true)
  private readonly _isDisabledByForm = signal(false)

  /**
   * Value written by the form before the model was available. Applied as soon
   * as it is.
   */
  private _pendingValue: D | null = null
  private _hasPendingValue = false

  private _selectionSubscription: Subscription | null = null

  constructor() {
    // Validity depends on state the form cannot see, so the control has to be
    // told to re-run the validators when it changes.
    effect(() => {
      this._minDate()
      this._maxDate()
      this._dateFilter()
      this._isParseValid()

      untracked(() => this._onValidatorChange())
    })
  }

  public writeValue(value: unknown): void {
    this._assignValue(this._deserialize(value))
  }

  public registerOnChange(onChange: (value: D | null) => void): void {
    this._onChange = onChange
  }

  public registerOnTouched(onTouched: () => void): void {
    this._onTouched = onTouched
  }

  public setDisabledState(disabled: boolean): void {
    this._isDisabledByForm.set(disabled)
  }

  public validate(control: AbstractControl): ValidationErrors | null {
    return this._validator?.(control) ?? null
  }

  public registerOnValidatorChange(onValidatorChange: () => void): void {
    this._onValidatorChange = onValidatorChange
  }

  /**
   * Connects the selection model the input shares with its datepicker and
   * flushes the value the form may have written before that.
   */
  public _registerModel(model: CkDateSelectionModel<S, D>): void {
    // The model can be handed over more than once, e.g. once it reaches a
    // range input that passes it on to both of its halves.
    if (this._model() === model) return

    this._selectionSubscription?.unsubscribe()
    this._model.set(model)

    this._selectionSubscription = model.selectionChanged
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(change => this._selectionChanged(change))

    if (!this._hasPendingValue) return

    this._hasPendingValue = false
    this._assignValue(this._pendingValue)
  }

  /** Sets form control value. Assigned via `ControlValueAccessor`. */
  protected _onChange: (value: D | null) => void = () => null

  /** Marks form control as touched. Assigned via `ControlValueAccessor`. */
  protected _onTouched: () => void = () => null

  /** Re-runs the validators. Assigned via `Validator`. */
  protected _onValidatorChange: () => void = () => null

  /** Parses the typed value and puts it into the selection. */
  protected _handleInput(event: Event): void {
    const text = _getEventTarget<HTMLInputElement>(event)?.value ?? ''
    const parsed = this._dateAdapter.parse(
      text,
      this._dateFormats.parse.dateInput,
    )

    // An empty field is not a parse error, a value that isn't a date is.
    this._isParseValid.set(!parsed || this._dateAdapter.isValid(parsed))

    const date = this._dateAdapter.getValidDateOrNull(parsed)
    const hasChanged = !this._dateAdapter.sameDate(date, this.value())

    // Every null is reported to the form, even when the value stays null:
    // typing an unparsable date doesn't change the value, but it does change
    // the validity, and validators only re-run on a value report.
    if (!date || hasChanged) this._onChange(date)

    if (!hasChanged) return

    this._assignValueToModel(date)
    this.dateInput.emit(date)
  }

  /** Commits the typed value, mirroring the native `change` event. */
  protected _handleChange(): void {
    this.dateChange.emit(this.value())
  }

  protected _handleBlur(): void {
    // Bring a partially typed value back to the display format.
    if (this.value()) this._formatValue(this.value())

    this._onTouched()
  }

  /** Opens the popup on Alt + Down Arrow, the shortcut of a native picker. */
  protected _handleKeydown(event: KeyboardEvent): void {
    if (event.keyCode !== DOWN_ARROW || !hasModifierKey(event, 'altKey')) return

    this._openPopup()
    event.preventDefault()
  }

  /** Validators every date input runs. */
  protected _getValidators(): ValidatorFn[] {
    return [
      parseDateValidator(
        this._isParseValid,
        () => this.host.nativeElement.value,
      ),
      minDateValidator(this._dateAdapter, () => this._minDate()),
      maxDateValidator(this._dateAdapter, () => this._maxDate()),
      dateFilterValidator(this._dateAdapter, () => this._dateFilter()),
    ]
  }

  /** Whether the input is disabled by whatever it belongs to, e.g. a group. */
  protected _isDisabledByParent(): boolean {
    return false
  }

  /**
   * Whether a selection change made elsewhere concerns this input. Changes it
   * made itself are ignored, as it is already up to date.
   */
  protected _shouldHandleChangeEvent(
    change: CkDateSelectionChange<S>,
  ): boolean {
    return change.source !== this
  }

  /** Picks the part of the selection this input holds. */
  protected abstract _getValueFromModel(selection: S): D | null

  /** Writes the date into the part of the selection this input holds. */
  protected abstract _assignValueToModel(date: D | null): void

  /** Opens the datepicker popup the input belongs to. */
  protected abstract _openPopup(): void

  /** Renders the date in the input using the display format. */
  protected _formatValue(date: D | null): void {
    this.host.nativeElement.value = date
      ? this._dateAdapter.format(date, this._dateFormats.display.dateInput)
      : ''
  }

  /** Puts the date into the selection, deferring until the model exists. */
  private _assignValue(date: D | null): void {
    if (!this._model()) {
      this._pendingValue = date
      this._hasPendingValue = true

      return
    }

    this._assignValueToModel(date)
    this._formatValue(date)
  }

  /**
   * Converts a value coming from a form control into a date, keeping track of
   * whether it was usable at all.
   */
  private _deserialize(value: unknown): D | null {
    const date = this._dateAdapter.deserialize(value)

    this._isParseValid.set(!date || this._dateAdapter.isValid(date))

    return this._dateAdapter.getValidDateOrNull(date)
  }

  /**
   * Reflects a selection change made elsewhere, e.g. in the calendar: renders
   * the date and notifies both the form and the consumer.
   */
  private _selectionChanged(change: CkDateSelectionChange<S>): void {
    if (this._shouldHandleChangeEvent(change)) {
      return this._reflectSelection(
        this._getValueFromModel(change.selection),
        this._getValueFromModel(change.oldValue),
      )
    }

    // The change leaves the date this input holds alone, but it can still
    // invalidate it — the start of a range must not run past its end. A
    // change the input made itself needs no such nudge: it has already
    // reported the new value to the form, which revalidates it anyway.
    if (change.source !== this) this._onValidatorChange()
  }

  /**
   * Renders the date the input now holds and tells the form and the consumer
   * about it.
   */
  private _reflectSelection(date: D | null, oldDate: D | null): void {
    this._isParseValid.set(true)
    this._formatValue(date)
    this._onChange(date)
    this._onTouched()

    if (this._dateAdapter.sameDate(date, oldDate)) return

    this.dateInput.emit(date)
    this.dateChange.emit(date)
  }
}
