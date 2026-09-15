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
} from '@angular/core'
import { button } from '@corekit/ui/button'
import { CkDatepickerPanel } from '@corekit/ui/datepicker'
import { classNames } from '@corekit/ui/utils'
import { CkTimepickerIntl } from './timepicker-intl'

/**
 * Button opening and closing a timepicker popup.
 *
 * Renders a clock icon by default — project any content to replace it:
 *
 * ```html
 * <ck-timepicker-toggle [for]="picker">
 *   <lucide-icon name="alarm-clock" />
 * </ck-timepicker-toggle>
 * ```
 */
@Component({
  selector: 'ck-timepicker-toggle',
  exportAs: 'ckTimepickerToggle',
  templateUrl: './timepicker-toggle.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
})
export class CkTimepickerToggle implements OnDestroy {
  /** The timepicker this toggle should control. */
  public readonly for = input.required<CkDatepickerPanel>()

  /** Whether the toggle is disabled on its own. */
  public readonly disabled = input(false, { transform: booleanAttribute })

  /** Whether the toggle or the timepicker it controls is disabled. */
  public readonly isDisabled = computed(() => {
    return this.disabled() || this.for().isDisabled()
  })

  protected readonly _intl = inject(CkTimepickerIntl)

  protected readonly _buttonClass = classNames(
    button({ size: 'sm', shape: 'square', appearance: 'ghost' }),
  )

  private readonly _elementRef = inject<ElementRef<HTMLElement>>(ElementRef)

  constructor() {
    effect(() => this.for()._registerToggle(this._elementRef))
  }

  public ngOnDestroy(): void {
    this.for()._registerToggle(null)
  }

  protected _toggle(): void {
    if (this.for().isOpen()) return this.for().close()

    this.for().open()
  }
}
