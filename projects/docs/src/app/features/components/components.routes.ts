import type { Routes } from '@angular/router'

import { COMPONENTS_PATHS } from './components.paths'

export const COMPONENTS_ROUTES: Routes = [
  {
    path: COMPONENTS_PATHS.root,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: COMPONENTS_PATHS.typography,
      },
      {
        path: COMPONENTS_PATHS.typography,
        loadComponent: async () =>
          import('./typography-page/typography-page.component').then(
            c => c.TypographyPageComponent,
          ),
      },
      {
        path: COMPONENTS_PATHS.accordion,
        loadComponent: async () =>
          import('./accordion-page/accordion-page.component').then(
            c => c.AccordionPageComponent,
          ),
      },
      {
        path: COMPONENTS_PATHS.alert,
        loadComponent: async () =>
          import('./alert-page/alert-page.component').then(
            c => c.AlertPageComponent,
          ),
      },
      {
        path: COMPONENTS_PATHS.autocomplete,
        loadComponent: async () =>
          import('./autocomplete-page/autocomplete-page.component').then(
            c => c.AutocompletePageComponent,
          ),
      },
      {
        path: COMPONENTS_PATHS.avatar,
        loadComponent: async () =>
          import('./avatar-page/avatar-page.component').then(
            c => c.AvatarPageComponent,
          ),
      },
      {
        path: COMPONENTS_PATHS.badge,
        loadComponent: async () =>
          import('./badge-page/badge-page.component').then(
            c => c.BadgePageComponent,
          ),
      },
      {
        path: COMPONENTS_PATHS.button,
        loadComponent: async () =>
          import('./button-page/button-page.component').then(
            c => c.ButtonPageComponent,
          ),
      },
      {
        path: COMPONENTS_PATHS.card,
        loadComponent: async () =>
          import('./card-page/card-page.component').then(
            c => c.CardPageComponent,
          ),
      },
      {
        path: COMPONENTS_PATHS.checkbox,
        loadComponent: async () =>
          import('./checkbox-page/checkbox-page.component').then(
            c => c.CheckboxPageComponent,
          ),
      },
      {
        path: COMPONENTS_PATHS.datepicker,
        loadComponent: async () =>
          import('./datepicker-page/datepicker-page.component').then(
            c => c.DatepickerPageComponent,
          ),
      },
      {
        path: COMPONENTS_PATHS.timepicker,
        loadComponent: async () =>
          import('./timepicker-page/timepicker-page.component').then(
            c => c.TimepickerPageComponent,
          ),
      },
      {
        path: COMPONENTS_PATHS.dialog,
        loadComponent: async () =>
          import('./dialog-page/dialog-page.component').then(
            c => c.DialogPageComponent,
          ),
      },
      {
        path: COMPONENTS_PATHS.formField,
        loadComponent: async () =>
          import('./form-field-page/form-field-page.component').then(
            c => c.FormFieldPageComponent,
          ),
      },
      {
        path: COMPONENTS_PATHS.input,
        loadComponent: async () =>
          import('./input-page/input-page.component').then(
            c => c.InputPageComponent,
          ),
      },
      {
        path: COMPONENTS_PATHS.label,
        loadComponent: async () =>
          import('./label-page/label-page.component').then(
            c => c.LabelPageComponent,
          ),
      },
      {
        path: COMPONENTS_PATHS.radio,
        loadComponent: async () =>
          import('./radio-page/radio-page.component').then(
            c => c.RadioPageComponent,
          ),
      },
      {
        path: COMPONENTS_PATHS.table,
        loadComponent: async () =>
          import('./table-page/table-page.component').then(
            c => c.TablePageComponent,
          ),
      },
    ],
  },
]
