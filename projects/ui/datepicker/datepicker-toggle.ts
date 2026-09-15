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
import { classNames } from '@corekit/ui/utils'
import { CkDatepickerPanel } from './datepicker-base'
import { CkDatepickerIntl } from './datepicker-intl'

/**
 * Button opening and closing a datepicker popup.
 *
 * Renders a calendar icon by default — project any content to replace it:
 *
 * ```html
 * <ck-datepicker-toggle [for]="picker">
 *   <lucide-icon name="calendar-days" />
 * </ck-datepicker-toggle>
 * ```
 */
@Component({
  selector: 'ck-datepicker-toggle',
  exportAs: 'ckDatepickerToggle',
  templateUrl: './datepicker-toggle.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
})
export class CkDatepickerToggle implements OnDestroy {
  /** The datepicker this toggle should control. */
  public readonly for = input.required<CkDatepickerPanel>()

  /** Whether the toggle is disabled on its own. */
  public readonly disabled = input(false, { transform: booleanAttribute })

  /** Whether the toggle or the datepicker it controls is disabled. */
  public readonly isDisabled = computed(() => {
    return this.disabled() || this.for().isDisabled()
  })

  protected readonly _intl = inject(CkDatepickerIntl)

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
