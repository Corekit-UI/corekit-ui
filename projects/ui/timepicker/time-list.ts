import { _IdGenerator } from '@angular/cdk/a11y'
import {
  DOWN_ARROW,
  END,
  hasModifierKey,
  HOME,
  PAGE_DOWN,
  PAGE_UP,
  UP_ARROW,
} from '@angular/cdk/keycodes'
import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core'
import { classNames } from '@corekit/ui/utils'
import {
  timeListOptionStyles,
  timeListScrollerStyles,
  timeListStyles,
} from './time-list.styles'

/** Single option of a time column, e.g. an hour. */
export type CkTimeOption<V> = {
  /** Value the option stands for. */
  value: V

  /** Text rendered in the option, e.g. `09`. */
  label: string
}

/**
 * Options a page key moves by — one column of them, which is what
 * `--ck-time-visible-options` in the styles is set to.
 */
const PAGE_SIZE = 5

/**
 * How long the column has to sit still before what is in its middle counts as
 * picked. Scrolling reports no end of its own on every browser, so the rest is
 * waited out.
 */
const SETTLE_DELAY = 120

/**
 * One column of a time selector — a list of options that scroll past its
 * middle.
 *
 * The option that comes to rest in the middle is the picked one, whether it
 * got there by scrolling, by a click or by the keyboard. Marking that middle
 * is left to the selector, which draws one band across all of its columns.
 */
@Component({
  selector: 'ck-time-list',
  exportAs: 'ckTimeList',
  templateUrl: './time-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': '_class' },
})
export class CkTimeList<V> {
  /** Options the column scrolls through. */
  public readonly options = input.required<Array<CkTimeOption<V>>>()

  /** Accessible name of the column, e.g. `Hour`. */
  public readonly label = input.required<string>()

  /** Value of the picked option. */
  public readonly value = model.required<V>()

  /**
   * Whether the column is the one to take the focus when the popup holding it
   * opens. The popup looks for the mark rather than for the column, the way
   * it looks for the active day of a calendar.
   */
  public readonly active = input(false, { transform: booleanAttribute })

  protected readonly _class = classNames(timeListStyles)
  protected readonly _scrollerClass = classNames(timeListScrollerStyles)

  protected readonly _renderedOptions = computed(() => {
    const value = this.value()

    return this.options().map((option, index) => {
      const isSelected = option.value === value

      return {
        ...option,
        isSelected,
        id: this._optionId(index),
        class: classNames(timeListOptionStyles({ selected: isSelected })),
      }
    })
  })

  /** The option a screen reader is pointed at — the picked one. */
  protected readonly _activeOptionId = computed(() => {
    const index = this._selectedIndex()

    return index >= 0 ? this._optionId(index) : null
  })

  private readonly _scroller =
    viewChild.required<ElementRef<HTMLElement>>('scroller')

  private readonly _idBase = inject(_IdGenerator).getId('ck-time-option-')

  /**
   * Index of the picked option, `-1` when the value is not among the options,
   * e.g. while they are being replaced.
   */
  private readonly _selectedIndex = computed(() => {
    const value = this.value()

    return this.options().findIndex(option => option.value === value)
  })

  private _settleTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * Whether the column has been placed once already. The first placement
   * cannot be animated: the column is not on screen yet, and the value it
   * opens at was not scrolled to by anyone.
   */
  private _hasBeenPlaced = false

  /** Whether the scroll now under way was started by the column itself. */
  private _isScrollingToValue = false

  constructor() {
    // Runs after the options are in the DOM, which is what the column is
    // measured and scrolled by.
    afterRenderEffect(() => {
      const index = this._selectedIndex()

      this._scrollToIndex(index)
    })

    inject(DestroyRef).onDestroy(() => this._clearSettleTimer())
  }

  /** Picks the clicked option, bringing it to the middle of the column. */
  protected _select(value: V): void {
    this.value.set(value)
  }

  /**
   * Waits for the scrolling to stop before reading what it landed on: every
   * frame of it would otherwise count as a value of its own.
   */
  protected _handleScroll(): void {
    this._clearSettleTimer()

    this._settleTimer = setTimeout(() => this._settle(), SETTLE_DELAY)
  }

  /** Moves the picked option with the arrow, page and edge keys. */
  protected _handleKeydown(event: KeyboardEvent): void {
    if (hasModifierKey(event)) return

    const options = this.options()

    if (!options.length) return

    const target = this._indexFromKeyCode(event.keyCode, options.length)

    if (target === null) return

    const index = Math.min(Math.max(target, 0), options.length - 1)

    event.preventDefault()
    this.value.set(options[index].value)
  }

  /**
   * Maps a navigation key to the index it moves to, `null` for keys the
   * column leaves alone.
   */
  private _indexFromKeyCode(keyCode: number, length: number): number | null {
    // A value missing from the options moves from the first one.
    const index = Math.max(this._selectedIndex(), 0)

    if (keyCode === UP_ARROW) return index - 1
    if (keyCode === DOWN_ARROW) return index + 1
    if (keyCode === PAGE_UP) return index - PAGE_SIZE
    if (keyCode === PAGE_DOWN) return index + PAGE_SIZE
    if (keyCode === HOME) return 0
    if (keyCode === END) return length - 1

    return null
  }

  /** Picks whatever option the column came to rest on. */
  private _settle(): void {
    this._settleTimer = null

    // A scroll the column started itself only puts the picked option back
    // in the middle, so there is nothing to report and nothing to correct.
    if (this._isScrollingToValue) {
      this._isScrollingToValue = false

      return
    }

    const options = this.options()
    const index = this._indexAtCenter()

    if (index < 0 || index >= options.length) return

    const { value } = options[index]

    if (value !== this.value()) this.value.set(value)
  }

  /**
   * Index of the option currently in the middle of the column.
   *
   * The padding above the first option is exactly the distance from the top
   * of the column to its middle, which leaves every option a whole number of
   * option heights away from the top of the scroll.
   */
  private _indexAtCenter(): number {
    const optionHeight = this._optionHeight()

    if (!optionHeight) return -1

    return Math.round(this._scroller().nativeElement.scrollTop / optionHeight)
  }

  /** Brings the option at the given index to the middle of the column. */
  private _scrollToIndex(index: number): void {
    const optionHeight = this._optionHeight()

    if (index < 0 || !optionHeight) return

    const scroller = this._scroller().nativeElement

    // Snapping leaves the scroll a fraction short of the option it settled
    // on, which must not be mistaken for the column being out of place.
    if (this._indexAtCenter() === index) {
      this._hasBeenPlaced = true

      return
    }

    this._isScrollingToValue = true

    scroller.scrollTo({
      top: index * optionHeight,
      behavior: this._hasBeenPlaced ? 'smooth' : 'instant',
    })

    this._hasBeenPlaced = true
  }

  /**
   * Height of a single option, `0` while the column has too few of them for
   * the scroll to tell.
   *
   * Read off the scroll rather than off an option's own box: the popup zooms
   * in as it opens, and a box measured under that transform comes out smaller
   * than the option really is, which would land every scroll short.
   */
  private _optionHeight(): number {
    const count = this.options().length

    if (count < 2) return 0

    const scroller = this._scroller().nativeElement

    // The scroll runs past the column by one option height per option beyond
    // the first, the padding at either end being what centres the outermost
    // ones.
    return (scroller.scrollHeight - scroller.clientHeight) / (count - 1)
  }

  /**
   * Id of the option at the given index. Built in one place, as the options
   * and the listbox pointing at one of them have to agree on it.
   */
  private _optionId(index: number): string {
    return `${this._idBase}-${index}`
  }

  private _clearSettleTimer(): void {
    if (this._settleTimer === null) return

    clearTimeout(this._settleTimer)
    this._settleTimer = null
  }
}
