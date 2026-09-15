import { Directionality } from '@angular/cdk/bidi'
import { ENTER, LEFT_ARROW, RIGHT_ARROW, SPACE } from '@angular/cdk/keycodes'
import {
  afterNextRender,
  computed,
  Directive,
  ElementRef,
  inject,
  Injector,
  input,
  output,
} from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { CK_DATE_FORMATS, CkDateAdapter } from '@corekit/ui/core'
import { CkDateRange } from './date-selection-model'

/**
 * Base class of calendar views.
 *
 * Owns the state shared by all views (`activeDate`, `selected`, boundaries)
 * and the keyboard navigation skeleton. Concrete views define their grid
 * generation, the key-to-date mapping and what selecting the active date
 * means.
 */
@Directive()
export abstract class CkCalendarViewBase<D> {
  /** The date defining the displayed period and the active (focusable) cell. */
  public readonly activeDate = input.required<D>()

  /** The currently selected date or range. */
  public readonly selected = input<D | CkDateRange<D> | null>(null)

  /** The minimum selectable date. */
  public readonly min = input<D | null>(null)

  /** The maximum selectable date. */
  public readonly max = input<D | null>(null)

  /** Function disabling arbitrary dates, e.g. weekends. */
  public readonly dateFilter = input<((date: D) => boolean) | null>(null)

  /** Event emitted when a date is selected. */
  public readonly selectedChange = output<D>()

  /** Event emitted when the active date is moved with the keyboard. */
  public readonly activeDateChange = output<D>()

  protected readonly _dateAdapter = inject<CkDateAdapter<D>>(CkDateAdapter)
  protected readonly _dateFormats = inject(CK_DATE_FORMATS)

  /**
   * The single date the view highlights as selected. A range is represented
   * by its start, falling back to its end — only the month view can render a
   * range as a whole.
   */
  protected readonly _selectedDate = computed(() => {
    const selected = this.selected()

    if (!(selected instanceof CkDateRange)) return selected

    return selected.start ?? selected.end
  })

  /** Valid `min` boundary, `null` if absent or invalid. */
  protected readonly _min = computed(() => {
    return this._dateAdapter.getValidDateOrNull(this.min())
  })

  /** Valid `max` boundary, `null` if absent or invalid. */
  protected readonly _max = computed(() => {
    return this._dateAdapter.getValidDateOrNull(this.max())
  })

  private readonly _elementRef = inject<ElementRef<HTMLElement>>(ElementRef)
  private readonly _injector = inject(Injector)
  private readonly _directionality = inject(Directionality)

  /** Layout direction of the view. */
  private readonly _direction = toSignal(this._directionality.change, {
    initialValue: this._directionality.value,
  })

  /**
   * Moves the active date with the view's navigation keys, selects it with
   * Enter/Space.
   */
  protected _handleKeydown(event: KeyboardEvent): void {
    if (event.keyCode === ENTER || event.keyCode === SPACE) {
      this._selectActiveDate()

      return event.preventDefault()
    }

    const newDate = this._dateFromKeyCode(this._resolveKeyCode(event.keyCode))

    if (newDate === null) return

    this._moveActiveDate(newDate)
    event.preventDefault()
  }

  /**
   * Makes the date active, clamping it to the `min`/`max` range, and moves
   * focus to its cell.
   */
  protected _moveActiveDate(date: D): void {
    const clampedDate = this._dateAdapter.clampDate(
      date,
      this._min(),
      this._max(),
    )

    if (this._dateAdapter.sameDate(clampedDate, this.activeDate())) return

    this.activeDateChange.emit(clampedDate)
    this._focusActiveCellAfterRender()
  }

  /**
   * Maps a navigation key to the new active date, `null` for irrelevant keys.
   */
  protected abstract _dateFromKeyCode(keyCode: number): D | null

  /** Selects the currently active date if the view allows it. */
  protected abstract _selectActiveDate(): void

  /**
   * Mirrors the horizontal arrows in RTL layouts, where the grid is laid out
   * right to left, so that an arrow always moves to the cell it points at.
   */
  private _resolveKeyCode(keyCode: number): number {
    if (this._direction() !== 'rtl') return keyCode
    if (keyCode === LEFT_ARROW) return RIGHT_ARROW
    if (keyCode === RIGHT_ARROW) return LEFT_ARROW

    return keyCode
  }

  /** Focuses the button of the active cell once the grid is re-rendered. */
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
