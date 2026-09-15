import { Directionality } from '@angular/cdk/bidi'
import { BACKSPACE, LEFT_ARROW, RIGHT_ARROW } from '@angular/cdk/keycodes'
import {
  computed,
  Directive,
  forwardRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators } from '@angular/forms'
import { classNames } from '@corekit/ui/utils'
import { CkDateRangeInput } from './date-range-input'
import { dateRangeInputPartStyles } from './date-range-input.styles'
import { CkDateRange, CkDateSelectionChange } from './date-selection-model'
import { CkDatepickerInputBase } from './datepicker-input-base'
import { endDateValidator, startDateValidator } from './datepicker-validators'

/**
 * Base of the two inputs a {@link CkDateRangeInput `ck-date-range-input`} is
 * made of.
 *
 * Both halves write into the same range and take their boundaries, their
 * filter and their popup from the group around them.
 */
@Directive()
export abstract class CkDateRangeInputPartBase<D> extends CkDatepickerInputBase<
  CkDateRange<D>,
  D
> {
  public readonly class = input<string>()

  /**
   * Text shown while the half is empty. Declared as an input rather than read
   * off the element, so that the mirror follows it — a placeholder that
   * arrives late, e.g. a translated one, would otherwise leave the half
   * collapsed to nothing.
   */
  public readonly placeholder = input('')

  /** Group the input is a half of. */
  public readonly _rangeInput = inject<CkDateRangeInput<D>>(CkDateRangeInput)

  /**
   * Text the group mirrors to size this half. An empty input is as wide as
   * its placeholder, so that the placeholders read as one hint.
   */
  public readonly _mirrorValue = computed(() => {
    return this._rawValue() || this.placeholder()
  })

  protected readonly _minDate = computed(() => this._rangeInput.min())
  protected readonly _maxDate = computed(() => this._rangeInput.max())
  protected readonly _dateFilter = computed(() => this._rangeInput.dateFilter())

  protected readonly _class = computed(() => {
    return classNames(dateRangeInputPartStyles, this.class())
  })

  /** Text currently in the input, as the user sees it. */
  private readonly _rawValue = signal('')

  private readonly _directionality = inject(Directionality)

  /** Layout direction, mirroring the way the caret moves between the halves. */
  private readonly _direction = toSignal(this._directionality.change, {
    initialValue: this._directionality.value,
  })

  /** Moves the focus into the input. */
  public focus(): void {
    this.host.nativeElement.focus()
  }

  /** Focuses the input, putting the caret at the given position. */
  public _focusAt(position: number): void {
    this.host.nativeElement.setSelectionRange(position, position)
    this.host.nativeElement.focus()
  }

  protected override _handleInput(event: Event): void {
    super._handleInput(event)
    this._rawValue.set(this.host.nativeElement.value)
  }

  protected override _formatValue(date: D | null): void {
    super._formatValue(date)
    this._rawValue.set(this.host.nativeElement.value)
  }

  /** Whether the layout runs left to right. */
  protected _isLtr(): boolean {
    return this._direction() !== 'rtl'
  }

  /** Whether nothing is selected and the caret sits at the given position. */
  protected _isCaretAt(position: number): boolean {
    const { selectionStart, selectionEnd } = this.host.nativeElement

    return selectionStart === position && selectionEnd === position
  }

  protected _openPopup(): void {
    this._rangeInput.rangePicker().open()
  }

  protected override _isDisabledByParent(): boolean {
    return this._rangeInput.disabled()
  }

  /**
   * Only a change of the end of the range this half holds concerns it. That
   * covers the other half writing into the range too: it leaves this end
   * alone, so there is nothing to render — the input is only told to
   * revalidate, as the two ends validate against each other.
   */
  protected override _shouldHandleChangeEvent(
    change: CkDateSelectionChange<CkDateRange<D>>,
  ): boolean {
    if (!super._shouldHandleChangeEvent(change)) return false

    return !this._dateAdapter.sameDate(
      this._getValueFromModel(change.oldValue),
      this._getValueFromModel(change.selection),
    )
  }
}

const START_DATE_VALUE_ACCESSOR_PROVIDER = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => CkStartDate),
  multi: true,
}

const START_DATE_VALIDATOR_PROVIDER = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => CkStartDate),
  multi: true,
}

/** Input holding the start of a date range. */
@Directive({
  selector: 'input[ckStartDate]',
  exportAs: 'ckStartDate',
  providers: [
    START_DATE_VALUE_ACCESSOR_PROVIDER,
    START_DATE_VALIDATOR_PROVIDER,
  ],
  host: {
    type: 'text',
    '[class]': '_class()',
    '[disabled]': 'isDisabled()',
    '[attr.placeholder]': 'placeholder() || null',
    '[attr.aria-haspopup]': '"dialog"',
    '[attr.aria-expanded]': '_rangeInput.rangePicker().isOpen()',
    '[attr.aria-controls]':
      '_rangeInput.rangePicker().isOpen() ? _rangeInput.rangePicker().id : null',
    '(input)': '_handleInput($event)',
    '(change)': '_handleChange()',
    '(blur)': '_handleBlur()',
    '(keydown)': '_handleKeydown($event)',
  },
})
export class CkStartDate<D>
  extends CkDateRangeInputPartBase<D>
  implements OnInit, OnDestroy
{
  protected readonly _validator = Validators.compose([
    ...this._getValidators(),
    startDateValidator(
      this._dateAdapter,
      () => this._model()?.selection().end ?? null,
    ),
  ])

  public ngOnInit(): void {
    this._rangeInput._registerStart(this)
  }

  public ngOnDestroy(): void {
    this._rangeInput._registerStart(null)
  }

  /**
   * Hands the caret over to the end of the range when it runs past the end of
   * the text, so that both halves feel like one field.
   */
  protected override _handleKeydown(event: KeyboardEvent): void {
    const forwardKey = this._isLtr() ? RIGHT_ARROW : LEFT_ARROW
    const endInput = this._rangeInput._endInput()

    const isLeaving =
      event.keyCode === forwardKey &&
      this._isCaretAt(this.host.nativeElement.value.length)

    if (!isLeaving || !endInput) return super._handleKeydown(event)

    event.preventDefault()
    endInput._focusAt(0)
  }

  protected _getValueFromModel(selection: CkDateRange<D>): D | null {
    return selection.start
  }

  protected _assignValueToModel(date: D | null): void {
    const model = this._model()

    model?.updateSelection(
      new CkDateRange<D>(date, model.selection().end),
      this,
    )
  }
}

const END_DATE_VALUE_ACCESSOR_PROVIDER = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => CkEndDate),
  multi: true,
}

const END_DATE_VALIDATOR_PROVIDER = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => CkEndDate),
  multi: true,
}

/** Input holding the end of a date range. */
@Directive({
  selector: 'input[ckEndDate]',
  exportAs: 'ckEndDate',
  providers: [END_DATE_VALUE_ACCESSOR_PROVIDER, END_DATE_VALIDATOR_PROVIDER],
  host: {
    type: 'text',
    '[class]': '_class()',
    '[disabled]': 'isDisabled()',
    '[attr.placeholder]': 'placeholder() || null',
    '[attr.aria-haspopup]': '"dialog"',
    '[attr.aria-expanded]': '_rangeInput.rangePicker().isOpen()',
    '[attr.aria-controls]':
      '_rangeInput.rangePicker().isOpen() ? _rangeInput.rangePicker().id : null',
    '(input)': '_handleInput($event)',
    '(change)': '_handleChange()',
    '(blur)': '_handleBlur()',
    '(keydown)': '_handleKeydown($event)',
  },
})
export class CkEndDate<D>
  extends CkDateRangeInputPartBase<D>
  implements OnInit, OnDestroy
{
  protected readonly _validator = Validators.compose([
    ...this._getValidators(),
    endDateValidator(
      this._dateAdapter,
      () => this._model()?.selection().start ?? null,
    ),
  ])

  public ngOnInit(): void {
    this._rangeInput._registerEnd(this)
  }

  public ngOnDestroy(): void {
    this._rangeInput._registerEnd(null)
  }

  /**
   * Hands the caret back to the start of the range when it runs past the
   * beginning of the text, or when there is nothing left to erase.
   */
  protected override _handleKeydown(event: KeyboardEvent): void {
    const backwardKey = this._isLtr() ? LEFT_ARROW : RIGHT_ARROW
    const startInput = this._rangeInput._startInput()

    const isErasingEmpty =
      event.keyCode === BACKSPACE && !this.host.nativeElement.value

    const isLeaving = event.keyCode === backwardKey && this._isCaretAt(0)

    if ((!isLeaving && !isErasingEmpty) || !startInput) {
      return super._handleKeydown(event)
    }

    // Backspace keeps erasing, it only moves on to the other half.
    if (isLeaving) event.preventDefault()

    startInput._focusAt(startInput.host.nativeElement.value.length)
  }

  protected _getValueFromModel(selection: CkDateRange<D>): D | null {
    return selection.end
  }

  protected _assignValueToModel(date: D | null): void {
    const model = this._model()

    model?.updateSelection(
      new CkDateRange<D>(model.selection().start, date),
      this,
    )
  }
}
