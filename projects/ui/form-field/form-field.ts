import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  DoCheck,
  effect,
  Injector,
  input,
  Optional,
  runInInjectionContext,
  signal,
} from '@angular/core'
import { FormGroupDirective, NgControl } from '@angular/forms'
import {
  CK_FORM_FIELD_INPUT,
  CkInputPrefix,
  CkInputSuffix,
} from '@corekit/ui/input'
import { CkLabel } from '@corekit/ui/label'
import { ErrorStateMatcher } from '@corekit/ui/reactive-forms'
import { classNames } from '@corekit/ui/utils'

@Component({
  selector: 'ck-form-field, [ckFormField]',
  exportAs: 'ckFormField',
  standalone: true,
  templateUrl: './form-field.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': '_class()' },
})
export class CkFormField implements DoCheck, AfterViewInit {
  public readonly class = input<string>()
  public readonly errorStateMatcher = input<ErrorStateMatcher>()
  public readonly errorState = computed(() => this._errorState())
  public readonly labelId = computed(() => this._label()?.id())

  protected readonly _class = computed(() => {
    return classNames(
      'relative block pb-5 pointer-coarse:max-lg:pb-5.5',
      this._errorState() && 'ck-invalid',
      this.class(),
    )
  })

  // A field can hold more than one control, e.g. the two halves of a date
  // range, and any of them can put it into the error state.
  private readonly _ngControls = contentChildren(NgControl, {
    descendants: true,
  })

  private readonly _label = contentChild(CkLabel)
  private readonly _input = contentChild(CK_FORM_FIELD_INPUT)
  private readonly _inputPrefix = contentChild(CkInputPrefix)
  private readonly _inputSuffix = contentChild(CkInputSuffix)
  private readonly _errorState = signal(false)

  constructor(
    private readonly _injector: Injector,
    private readonly _defaultErrorStateMatcher: ErrorStateMatcher,
    @Optional()
    private readonly _formGroupDirective?: FormGroupDirective,
  ) {}

  public ngDoCheck(): void {
    // This has to be recalculated every time change detection runs due to a lot
    // of events that we want to react, but cannot subscribe to.
    this._ngControls().length && this._calculateErrorState()
  }

  public ngAfterViewInit(): void {
    runInInjectionContext(this._injector, () => {
      effect(this._updateInputPadStart.bind(this))
      effect(this._updateInputPadEnd.bind(this))
    })
  }

  private _updateInputPadStart(): void {
    this._input()?.padStart(!!this._inputPrefix())
  }

  private _updateInputPadEnd(): void {
    this._input()?.padEnd(!!this._inputSuffix())
  }

  private _calculateErrorState(): void {
    const errorStateMatcher =
      this.errorStateMatcher() ?? this._defaultErrorStateMatcher

    const oldState = this._errorState()

    const newState = this._ngControls().some(control => {
      return errorStateMatcher.matches(control, this._formGroupDirective)
    })

    if (newState !== oldState) this._errorState.set(newState)
  }
}
