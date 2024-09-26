import { JsonPipe } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { CkAutocomplete, CkAutocompleteTrigger } from '@corekit/ui/autocomplete'
import { CkCheckbox } from '@corekit/ui/checkbox'
import { CkFormField } from '@corekit/ui/form-field'
import { CkInput, CkInputPrefix } from '@corekit/ui/input'
import { CkLabel } from '@corekit/ui/label'
import { CkOption } from '@corekit/ui/option'
import { LucideAngularModule } from 'lucide-angular'

type Framework = { name: string; stars: number; disabled: boolean }

const options: Framework[] = [
  { name: 'Angular', stars: 95700, disabled: false },
  { name: 'Analog.js', stars: 2500, disabled: false },
  { name: 'Vue', stars: 22800, disabled: false },
  { name: 'React', stars: 22800, disabled: true },
  { name: 'Next.js', stars: 208000, disabled: false },
  { name: 'Astro', stars: 45700, disabled: false },
]

@Component({
  selector: 'app-autocomplete-page',
  standalone: true,
  imports: [
    CkOption,
    CkAutocomplete,
    CkAutocompleteTrigger,
    ReactiveFormsModule,
    CkLabel,
    CkInput,
    CkInputPrefix,
    CkFormField,
    CkCheckbox,
    FormsModule,
    LucideAngularModule,
    JsonPipe,
  ],
  templateUrl: './autocomplete-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block space-y-3' },
})
export class AutocompletePageComponent {
  public readonly requireSelection = signal(true)
  public readonly autoActiveFirstOption = signal(true)
  public readonly framework = signal<Framework | undefined>(undefined)

  public readonly filteredOptions = computed(() => {
    const filterValue = this._filterValue().trim().toLowerCase()

    return options.filter(({ name, stars }) => {
      return `${name} (${this._numberFormatter(stars)} stars)`
        .toLowerCase()
        .includes(filterValue)
    })
  })

  private readonly _numberFormatter = Intl.NumberFormat('en', {
    notation: 'compact',
  }).format

  private readonly _filterValue = signal<string>('')

  public readonly displayFn = (framework: Framework | null): string => {
    return framework?.name
      ? `${framework.name} (${this._numberFormatter(framework.stars)} stars)`
      : ''
  }

  public filter(value: string | null): void {
    this._filterValue.set(value ?? '')
  }
}
