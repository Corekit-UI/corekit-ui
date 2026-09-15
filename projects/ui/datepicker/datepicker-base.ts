import { _IdGenerator } from '@angular/cdk/a11y'
import { Directionality } from '@angular/cdk/bidi'
import { ESCAPE, hasModifierKey } from '@angular/cdk/keycodes'
import {
  ConnectedPosition,
  Overlay,
  OverlayConfig,
  OverlayRef,
} from '@angular/cdk/overlay'
import {
  _getEventTarget,
  _getFocusedElementPierceShadowDom,
} from '@angular/cdk/platform'
import { TemplatePortal } from '@angular/cdk/portal'
import { DOCUMENT } from '@angular/common'
import {
  afterNextRender,
  booleanAttribute,
  computed,
  Directive,
  ElementRef,
  inject,
  Injector,
  input,
  OnDestroy,
  signal,
  Signal,
  TemplateRef,
  viewChild,
  ViewContainerRef,
} from '@angular/core'
import { CkDateNameStyle } from '@corekit/ui/core'
import { classNames } from '@corekit/ui/utils'
import { Subject } from 'rxjs'
import { CkCalendarView } from './calendar'
import { CkDateSelectionModel } from './date-selection-model'
import { CkDatepickerControl } from './datepicker-control'
import { datepickerPanelStyles } from './datepicker.styles'
import { CK_DATEPICKER_SCROLL_STRATEGY } from './scroll-strategy.token'

/**
 * The part of a datepicker its toggle button drives.
 *
 * Deliberately says nothing about the selection: a toggle only opens and
 * closes the popup, and the shape of the selection makes datepickers
 * incompatible with each other as types.
 */
export type CkDatepickerPanel = {
  /** Whether the popup is open. */
  isOpen: Signal<boolean>

  /** Whether the popup cannot be opened. */
  isDisabled: Signal<boolean>

  /** Opens the popup. */
  open(): void

  /** Closes the popup. */
  close(): void

  /** Connects the toggle button. Pass `null` to disconnect. */
  _registerToggle(toggle: ElementRef<HTMLElement> | null): void
}

/**
 * Base of the datepicker popups.
 *
 * Owns the popup itself — the overlay, the open state and the focus handling —
 * and the selection model shared with the connected control. Concrete
 * datepickers add the template and the selection model they work with: `C` is
 * the control they can be attached to, `S` is the shape of the selection,
 * `D` is the date type.
 */
@Directive()
export abstract class CkDatepickerBase<C extends CkDatepickerControl<D>, S, D>
  implements OnDestroy
{
  /**
   * The date the calendar is opened at. Defaults to the selected date or
   * today.
   */
  public readonly startAt = input<D | null>(null)

  /** The view the calendar is opened at. */
  public readonly startView = input<CkCalendarView>('month')

  /** Style of the weekday names in the month view header row. */
  public readonly weekdayStyle = input<CkDateNameStyle>('short')

  /** Whether the datepicker is disabled on its own. */
  public readonly disabled = input(false, { transform: booleanAttribute })

  /** Unique ID of the popup panel. */
  public readonly id = inject(_IdGenerator).getId('ck-datepicker-')

  /** Whether the popup is open. */
  public readonly isOpen = computed(() => this._isOpen())

  /**
   * Whether the datepicker cannot be opened — either it is disabled itself or
   * its control is.
   */
  public readonly isDisabled = computed(() => {
    return this.disabled() || (this._input()?.isDisabled() ?? false)
  })

  /**
   * Stream of closing animation completion events. The popup stays attached
   * until the animation ends.
   */
  public readonly exitAnimationEnd = new Subject<void>()

  /** Reference to the template of the panel. */
  public readonly _template =
    viewChild.required<TemplateRef<unknown>>('template')

  /** Selection state shared with the connected control. */
  public readonly _model =
    inject<CkDateSelectionModel<S, D>>(CkDateSelectionModel)

  /** Control connected to this datepicker. */
  public readonly _input = signal<C | null>(null)

  /**
   * Toggle button element connected to this datepicker. Its clicks must not
   * be treated as outside clicks.
   */
  public readonly _toggle = signal<ElementRef<HTMLElement> | null>(null)

  /** The current selection. */
  protected readonly _selected = computed(() => this._model.selection())

  /**
   * The date the calendar opens at, captured when the popup opens.
   *
   * Browsing is state of its own: were this derived from the selection, every
   * change of it would throw the open calendar back to the selected period —
   * which picking the start of a range does on every pick.
   */
  protected readonly _startAtOnOpen = signal<D | null>(null)

  // Boundaries and the filter belong to the control, as they also drive its
  // validation.
  protected readonly _min = computed(() => this._input()?.min() ?? null)
  protected readonly _max = computed(() => this._input()?.max() ?? null)

  protected readonly _dateFilter = computed(() => {
    return this._input()?.dateFilter() ?? null
  })

  protected readonly _class = computed(() => {
    return classNames(
      datepickerPanelStyles({ state: this._isOpen() ? 'open' : 'closed' }),
    )
  })

  private readonly _overlay = inject(Overlay)
  private readonly _viewContainerRef = inject(ViewContainerRef)
  private readonly _injector = inject(Injector)
  private readonly _document = inject(DOCUMENT)
  private readonly _directionality = inject(Directionality)
  private readonly _isOpen = signal(false)

  private readonly _scrollStrategyFactory = inject(
    CK_DATEPICKER_SCROLL_STRATEGY,
  )

  private _overlayRef: OverlayRef | null = null

  /** Element focused before the popup opened, to be focused back on close. */
  private _focusedElementBeforeOpen: HTMLElement | null = null

  public ngOnDestroy(): void {
    this._destroyOverlay()
    this.exitAnimationEnd.complete()
  }

  /** Opens the popup. Requires a connected control. */
  public open(): void {
    const control = this._input()

    if (!control || this.isOpen() || this.isDisabled()) return

    // The popup is built for the control it is anchored to, and the control
    // may well be a different one by now, so it is rebuilt every time.
    this._destroyOverlay()

    const overlayRef = this._createOverlay(control)

    this._focusedElementBeforeOpen = _getFocusedElementPierceShadowDom()
    this._startAtOnOpen.set(this.startAt() ?? control.getStartValue())

    // Mark as open before attaching so that the panel renders with the
    // entering animation instead of the exiting one.
    this._isOpen.set(true)

    overlayRef.attach(
      new TemplatePortal(this._template(), this._viewContainerRef),
    )

    this._focusActiveCellAfterRender()
  }

  /** Closes the popup. */
  public close(): void {
    if (!this.isOpen()) return

    this._isOpen.set(false)
    this._restoreFocus()
  }

  /**
   * Connects the control and hands it the selection model both of them share.
   * Pass `null` to disconnect.
   */
  public _registerInput(control: C | null): CkDateSelectionModel<S, D> {
    // The popup cannot outlive the control it is anchored to.
    if (control !== this._input()) this._destroyOverlay()

    this._input.set(control)

    return this._model
  }

  public _registerToggle(toggle: ElementRef<HTMLElement> | null): void {
    this._toggle.set(toggle)
  }

  /**
   * Writes the picked date to the selection and closes the popup once the
   * selection is complete.
   */
  protected _dateSelected(date: D | null): void {
    this._selectionFinished(date)

    if (this._model.isComplete()) this.close()
  }

  /**
   * Composes the picked date into the selection. A `null` date means the user
   * has abandoned the selection, which only a range can be.
   */
  protected abstract _selectionFinished(date: D | null): void

  /** Detaches the popup once it has finished animating out. */
  protected _animationEnd(event: AnimationEvent): void {
    if (event.animationName !== 'exit') return

    this._overlayRef?.detach()
    this.exitAnimationEnd.next()
  }

  /**
   * Tears the popup down, closing it if it is open. Called both before
   * building a new one and once the control it belongs to is gone.
   */
  private _destroyOverlay(): void {
    this._isOpen.set(false)
    this._focusedElementBeforeOpen = null
    this._overlayRef?.dispose()
    this._overlayRef = null
  }

  /** Focuses the active day of the calendar once the popup is rendered. */
  private _focusActiveCellAfterRender(): void {
    afterNextRender(
      {
        read: () => {
          this._overlayRef?.overlayElement
            .querySelector<HTMLButtonElement>('button[data-active]')
            ?.focus()
        },
      },
      { injector: this._injector },
    )
  }

  /**
   * Focuses the element that was focused before opening, but only if focus is
   * still inside the popup — closing by clicking elsewhere must not steal it.
   */
  private _restoreFocus(): void {
    const isFocusInsidePopup = this._overlayRef?.overlayElement.contains(
      this._document.activeElement,
    )

    if (isFocusInsidePopup) this._restoreFocusTarget()

    this._focusedElementBeforeOpen = null
  }

  private _restoreFocusTarget(): void {
    const previous = this._focusedElementBeforeOpen

    // Safari doesn't focus buttons on click, so the element focused before
    // opening can be the body — hand the focus to the control instead of
    // dropping it.
    if (previous && previous !== this._document.body) return previous.focus()

    this._input()?.focus()
  }

  private _createOverlay(control: C): OverlayRef {
    const origin = control.getConnectedOverlayOrigin()

    const positionStrategy = this._overlay
      .position()
      .flexibleConnectedTo(origin)
      .withPositions(this._getOverlayPositions())
      .withPush(false)
      .withFlexibleDimensions(false)
      .withViewportMargin(6)

    const overlayRef = this._overlay.create(
      new OverlayConfig({
        positionStrategy,
        scrollStrategy: this._scrollStrategyFactory(),
        // Makes the `start`/`end` positions follow the layout direction.
        direction: this._directionality,
      }),
    )

    overlayRef.outsidePointerEvents().subscribe(event => {
      const target = _getEventTarget<HTMLElement>(event)

      const isInside =
        origin.nativeElement.contains(target) ||
        this._toggle()?.nativeElement.contains(target)

      if (!isInside) this.close()
    })

    overlayRef.keydownEvents().subscribe(event => {
      if (event.keyCode !== ESCAPE || hasModifierKey(event)) return

      event.preventDefault()
      this.close()
    })

    this._overlayRef = overlayRef

    return overlayRef
  }

  private _getOverlayPositions(): ConnectedPosition[] {
    const offsetY = 4

    return [
      {
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'top',
        offsetY,
        panelClass: 'ck-position-below',
      },
      {
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'bottom',
        offsetY: -offsetY,
        panelClass: 'ck-position-above',
      },
    ]
  }
}
