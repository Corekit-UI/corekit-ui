import { _IdGenerator, CdkTrapFocus } from '@angular/cdk/a11y'
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  linkedSignal,
} from '@angular/core'
import { CkButton } from '@corekit/ui/button'
import { CkDateAdapter, CkHourFormat } from '@corekit/ui/core'
import {
  CK_SINGLE_DATE_SELECTION_MODEL_PROVIDER,
  CkDatepickerBase,
} from '@corekit/ui/datepicker'
import { classNames } from '@corekit/ui/utils'
import { CkTimeSelector } from './time-selector'
import { CkTimepickerIntl } from './timepicker-intl'
import { CkTimepickerInput } from './timepicker-input'
import {
  timepickerFooterStyles,
  timepickerPanelStyles,
} from './timepicker.styles'

/**
 * Timepicker popup panel selecting a time of day.
 *
 * Turning the columns only moves the time the panel is showing. Scrolling is
 * a restless way to pick anything, so nothing reaches the value until the
 * footer says so.
 *
 * Unlike a calendar, the panel always opens at the picked time, as its
 * columns cannot show a value without pointing at it. `startAt` only decides
 * where a panel with nothing picked yet opens.
 */
@Component({
  selector: 'ck-timepicker',
  exportAs: 'ckTimepicker',
  imports: [CdkTrapFocus, CkButton, CkTimeSelector],
  templateUrl: './timepicker.html',
  providers: [CK_SINGLE_DATE_SELECTION_MODEL_PROVIDER],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'hidden' },
})
export class CkTimepicker<D> extends CkDatepickerBase<
  CkTimepickerInput<D>,
  D | null,
  D
> {
  /**
   * Clock the columns are laid out on. Defaults to the one the locale keeps
   * time on.
   */
  public readonly hourFormat = input<CkHourFormat | null>(null)

  /**
   * Unique ID of the popup panel, named after the timepicker rather than the
   * datepicker base it is built on.
   */
  public override readonly id = inject(_IdGenerator).getId('ck-timepicker-')

  protected readonly _intl = inject(CkTimepickerIntl)

  protected readonly _panelClass = classNames(timepickerPanelStyles)
  protected readonly _footerClass = classNames(timepickerFooterStyles)

  /**
   * The time the columns are showing. Reset every time the popup opens, so
   * that a time left behind by a cancelled visit is not picked up by the
   * next one.
   *
   * A picked time wins over `startAt`, as the columns have to show what the
   * value holds. A popup with neither has to start somewhere, and the current
   * time is the least surprising place — read when the popup opens rather
   * than once, since it moves on between two openings.
   */
  protected readonly _pending = linkedSignal({
    source: () => ({
      isOpen: this.isOpen(),
      time: this._selected() ?? this._startAtOnOpen(),
    }),
    computation: ({ time }) => time ?? this._dateAdapter.today(),
  })

  private readonly _dateAdapter = inject<CkDateAdapter<D>>(CkDateAdapter)

  /**
   * Keeps the time the columns are showing, exactly as they hold it. Turning
   * a column already drops the seconds, so there is nothing to tidy up here —
   * and a Set without touching anything must leave the value as it was.
   */
  protected _apply(): void {
    this._dateSelected(this._pending())
  }

  /**
   * Picking a time replaces the selection. There is nothing to abandon in a
   * single time selection, so a `null` time is ignored.
   */
  protected _selectionFinished(date: D | null): void {
    if (date === null) return

    this._model.updateSelection(date, this)
  }
}
