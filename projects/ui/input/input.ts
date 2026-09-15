import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  signal,
} from '@angular/core'
import { CkNativeValidator } from '@corekit/ui/reactive-forms'
import { classNames } from '@corekit/ui/utils'
import { CK_FORM_FIELD_INPUT } from './form-field-input'
import { inputStyles } from './input.styles'

@Component({
  selector: '[ckInput]',
  exportAs: 'ckInput',
  standalone: true,
  template: '<ng-content />',
  hostDirectives: [CkNativeValidator],
  providers: [{ provide: CK_FORM_FIELD_INPUT, useExisting: CkInput }],
  // Marks the element for the styles that key off the presence of an input,
  // e.g. the spacing of a label above it.
  host: { ckFormFieldInput: '', '[class]': '_class' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CkInput {
  public readonly class = input<string>()

  public readonly commandedPadStart = input<boolean, unknown>(false, {
    alias: 'padStart',
    transform: booleanAttribute,
  })

  public readonly commandedPadEnd = input<boolean, unknown>(false, {
    alias: 'padEnd',
    transform: booleanAttribute,
  })

  protected get _class(): string {
    return classNames(
      inputStyles({ padStart: this._padStart(), padEnd: this._padEnd() }),
      this.class(),
    )
  }

  private readonly _padStart = signal(this.commandedPadStart())
  private readonly _padEnd = signal(this.commandedPadEnd())

  constructor() {
    effect(this._reflectCommandedPadStart.bind(this))
    effect(this._reflectCommandedPadEnd.bind(this))
  }

  public padStart(pad: boolean): void {
    this._padStart.set(pad)
  }

  public padEnd(pad: boolean): void {
    this._padEnd.set(pad)
  }

  private _reflectCommandedPadStart(): void {
    this._padStart.set(this.commandedPadStart())
  }

  private _reflectCommandedPadEnd(): void {
    this._padEnd.set(this.commandedPadEnd())
  }
}
