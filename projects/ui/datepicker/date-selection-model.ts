import {
  inject,
  Injectable,
  OnDestroy,
  Provider,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core'
import { CkDateAdapter } from '@corekit/ui/core'
import { Observable, Subject } from 'rxjs'

/**
 * Range of dates. Either end can be missing while the range is being picked.
 */
export class CkDateRange<D> {
  /**
   * Keeps objects that merely have `start` and `end` properties from being
   * assigned to a range. A range is told apart from a single date by its type
   * at runtime, so a structurally equivalent object would slip through.
   */
  private readonly _disableStructuralEquivalency!: never

  constructor(
    /** The start date of the range. */
    public readonly start: D | null,

    /** The end date of the range. */
    public readonly end: D | null,
  ) {}
}

/** Selection change notification. */
export type CkDateSelectionChange<S> = {
  /** New selection value. */
  selection: S

  /** Previous selection value. */
  oldValue: S

  /** Object that made the change, e.g. a datepicker or an input. */
  source: unknown
}

/**
 * State of a date selection shared between a datepicker and its input.
 *
 * Both parties mutate and observe the same model, making it the single source
 * of truth for the selected value. `S` is the shape of the selection — a
 * single date or a date range, `D` is the date type.
 */
// Each datepicker provides its own model instance, hence no `providedIn`.
// eslint-disable-next-line @angular-eslint/use-injectable-provided-in
@Injectable()
export abstract class CkDateSelectionModel<S, D> implements OnDestroy {
  /** Current selection. */
  public readonly selection: Signal<S>

  /** Stream of selection changes and their sources. */
  public readonly selectionChanged: Observable<CkDateSelectionChange<S>>

  private readonly _selection: WritableSignal<S>
  private readonly _selectionChanged = new Subject<CkDateSelectionChange<S>>()

  protected constructor(
    initialSelection: S,
    protected readonly _dateAdapter: CkDateAdapter<D>,
  ) {
    this._selection = signal(initialSelection)
    this.selection = this._selection.asReadonly()
    this.selectionChanged = this._selectionChanged.asObservable()
  }

  public ngOnDestroy(): void {
    this._selectionChanged.complete()
  }

  /** Sets the selection, notifying subscribers about the change source. */
  public updateSelection(selection: S, source: unknown): void {
    const oldValue = this.selection()

    this._selection.set(selection)
    this._selectionChanged.next({ selection, oldValue, source })
  }

  /**
   * Whether the selection is complete, e.g. both ends of a range are set.
   * How a picked date turns into a selection is up to the datepicker, not to
   * the model — a range, for one, is composed by a selection strategy.
   */
  public abstract isComplete(): boolean
}

/** Selection model holding a single date. */
// eslint-disable-next-line @angular-eslint/use-injectable-provided-in
@Injectable()
export class CkSingleDateSelectionModel<D> extends CkDateSelectionModel<
  D | null,
  D
> {
  constructor() {
    super(null, inject<CkDateAdapter<D>>(CkDateAdapter))
  }

  public isComplete(): boolean {
    return this.selection() !== null
  }
}

/** Provides a selection model holding a single date. */
export const CK_SINGLE_DATE_SELECTION_MODEL_PROVIDER: Provider = {
  provide: CkDateSelectionModel,
  useClass: CkSingleDateSelectionModel,
}

/** Selection model holding a date range. */
// eslint-disable-next-line @angular-eslint/use-injectable-provided-in
@Injectable()
export class CkRangeDateSelectionModel<D> extends CkDateSelectionModel<
  CkDateRange<D>,
  D
> {
  constructor() {
    super(
      new CkDateRange<D>(null, null),
      inject<CkDateAdapter<D>>(CkDateAdapter),
    )
  }

  public isComplete(): boolean {
    const { start, end } = this.selection()

    return start !== null && end !== null
  }
}

/** Provides a selection model holding a date range. */
export const CK_RANGE_DATE_SELECTION_MODEL_PROVIDER: Provider = {
  provide: CkDateSelectionModel,
  useClass: CkRangeDateSelectionModel,
}
