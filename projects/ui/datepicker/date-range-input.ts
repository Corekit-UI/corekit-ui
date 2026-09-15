import { _IdGenerator } from '@angular/cdk/a11y'
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core'
import { CkFormField } from '@corekit/ui/form-field'
import { CK_FORM_FIELD_INPUT, CkFormFieldInput } from '@corekit/ui/input'
import { classNames } from '@corekit/ui/utils'
import type { CkEndDate, CkStartDate } from './date-range-input-parts'
import {
  dateRangeInputEndWrapperStyles,
  dateRangeInputMirrorStyles,
  dateRangeInputSeparatorStyles,
  dateRangeInputStyles,
  dateRangeInputWrapperStyles,
} from './date-range-input.styles'
import { CkDateRange, CkDateSelectionModel } from './date-selection-model'
import { CkDatepickerBase } from './datepicker-base'
import { CkDatepickerControl } from './datepicker-control'

/**
 * Group of two inputs holding the ends of a date range.
 *
 * Both halves are projected into it and share a single frame, a single popup
 * and a single set of boundaries:
 *
 * ```html
 * <ck-date-range-input [rangePicker]="picker">
 *   <input ckStartDate placeholder="Start date" />
 *   <input ckEndDate placeholder="End date" />
 * </ck-date-range-input>
 *
 * <ck-date-range-picker #picker />
 * ```
 */
@Component({
  selector: 'ck-date-range-input',
  exportAs: 'ckDateRangeInput',
  templateUrl: './date-range-input.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: CK_FORM_FIELD_INPUT, useExisting: CkDateRangeInput }],
  host: {
    role: 'group',
    // Marks the group as the input of the form field around it, the same way
    // `[ckInput]` marks a single one.
    ckFormFieldInput: '',
    '[attr.id]': 'id()',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '[attr.aria-labelledby]': '_labelId()',
    '[class]': '_class()',
  },
})
export class CkDateRangeInput<D>
  implements OnInit, OnDestroy, CkDatepickerControl<D>, CkFormFieldInput
{
  /** The range picker this group should control. */
  public readonly rangePicker =
    input.required<
      CkDatepickerBase<CkDatepickerControl<D>, CkDateRange<D>, D>
    >()

  /** The minimum selectable date, shared by both halves. */
  public readonly min = input<D | null>(null)

  /** The maximum selectable date, shared by both halves. */
  public readonly max = input<D | null>(null)

  /** Function disabling arbitrary dates, e.g. weekends. */
  public readonly dateFilter = input<((date: D) => boolean) | null>(null, {
    alias: 'ckDateRangeFilter',
  })

  /** Whether both halves are disabled. */
  public readonly disabled = input(false, { transform: booleanAttribute })

  /** Text rendered between the two halves. */
  public readonly separator = input('–')

  public readonly class = input<string>()

  /**
   * ID of the group. Generated when the consumer doesn't set one, as the
   * group is a natural target for `aria-describedby` from the outside.
   */
  public readonly id = input(inject(_IdGenerator).getId('ck-date-range-input-'))

  /** The range the two halves hold. */
  public readonly value = computed(() => {
    return this._model()?.selection() ?? new CkDateRange<D>(null, null)
  })

  /**
   * Whether the popup cannot be opened from the group. A half-disabled group
   * still has a half to pick a date for.
   */
  public readonly isDisabled = computed(() => {
    const start = this._startInput()
    const end = this._endInput()

    if (!start || !end) return this.disabled()

    return start.isDisabled() && end.isDisabled()
  })

  /** Half of the group holding the start of the range. */
  public readonly _startInput = signal<CkStartDate<D> | null>(null)

  /** Half of the group holding the end of the range. */
  public readonly _endInput = signal<CkEndDate<D> | null>(null)

  /**
   * Names the group after the label of the form field around it. Without it
   * the group is announced as an unnamed collection of two inputs.
   */
  protected readonly _labelId = computed(() => {
    return this._formField?.labelId() ?? null
  })

  protected readonly _separatorClass = dateRangeInputSeparatorStyles
  protected readonly _wrapperClass = dateRangeInputWrapperStyles
  protected readonly _endWrapperClass = dateRangeInputEndWrapperStyles
  protected readonly _mirrorClass = dateRangeInputMirrorStyles

  /** Text sizing the box around the start of the range. */
  protected readonly _startMirror = computed(() => {
    return this._startInput()?._mirrorValue() ?? ''
  })

  /** Text sizing the box around the end of the range. */
  protected readonly _endMirror = computed(() => {
    return this._endInput()?._mirrorValue() ?? ''
  })

  protected readonly _class = computed(() => {
    return classNames(
      dateRangeInputStyles({
        padStart: this._padStart(),
        padEnd: this._padEnd(),
        disabled: this.isDisabled(),
      }),
      this.class(),
    )
  })

  private readonly _elementRef = inject<ElementRef<HTMLElement>>(ElementRef)
  private readonly _formField = inject(CkFormField, { optional: true })
  private readonly _padStart = signal(false)
  private readonly _padEnd = signal(false)

  /** Selection state shared with the range picker. */
  private readonly _model = signal<CkDateSelectionModel<
    CkDateRange<D>,
    D
  > | null>(null)

  constructor() {
    // The halves are projected into the group, so they arrive after it has
    // registered with the picker — and either of them may be missing.
    effect(() => {
      const model = this._model()

      if (!model) return

      this._startInput()?._registerModel(model)
      this._endInput()?._registerModel(model)
    })
  }

  public ngOnInit(): void {
    this._model.set(this.rangePicker()._registerInput(this))
  }

  public ngOnDestroy(): void {
    this.rangePicker()._registerInput(null)
  }

  /** Reserves room at the start of the frame for a prefix. */
  public padStart(pad: boolean): void {
    this._padStart.set(pad)
  }

  /** Reserves room at the end of the frame for a suffix. */
  public padEnd(pad: boolean): void {
    this._padEnd.set(pad)
  }

  /**
   * Moves the focus into the group — to the half the user would fill next.
   */
  public focus(): void {
    if (this.value().start === null) return this._startInput()?.focus()

    this._endInput()?.focus()
  }

  /** The date the calendar opens at — the start of the range. */
  public getStartValue(): D | null {
    return this.value().start
  }

  /** Element the popup is anchored to — the frame around both halves. */
  public getConnectedOverlayOrigin(): ElementRef<HTMLElement> {
    return this._elementRef
  }

  public _registerStart(part: CkStartDate<D> | null): void {
    this._startInput.set(part)
  }

  public _registerEnd(part: CkEndDate<D> | null): void {
    this._endInput.set(part)
  }
}
