import { InjectionToken } from '@angular/core'

import { MenuItem } from '../types/menu-item'
import { COMPONENTS_PATHS } from '../../features/components/components.paths'

export const COMPONENTS_MENU_RAW: MenuItem[] = [
  {
    title: 'Typography',
    link: `${COMPONENTS_PATHS.root}/${COMPONENTS_PATHS.typography}`,
  },
  {
    title: 'Accordion',
    link: `${COMPONENTS_PATHS.root}/${COMPONENTS_PATHS.accordion}`,
  },
  {
    title: 'Alert',
    link: `${COMPONENTS_PATHS.root}/${COMPONENTS_PATHS.alert}`,
  },
  {
    title: 'Autocomplete',
    link: `${COMPONENTS_PATHS.root}/${COMPONENTS_PATHS.autocomplete}`,
  },
  {
    title: 'Avatar',
    link: `${COMPONENTS_PATHS.root}/${COMPONENTS_PATHS.avatar}`,
  },
  {
    title: 'Badge',
    link: `${COMPONENTS_PATHS.root}/${COMPONENTS_PATHS.badge}`,
  },
  {
    title: 'Button',
    link: `${COMPONENTS_PATHS.root}/${COMPONENTS_PATHS.button}`,
  },
  {
    title: 'Card',
    link: `${COMPONENTS_PATHS.root}/${COMPONENTS_PATHS.card}`,
  },
  {
    title: 'Checkbox',
    link: `${COMPONENTS_PATHS.root}/${COMPONENTS_PATHS.checkbox}`,
  },
  {
    title: 'Datepicker',
    link: `${COMPONENTS_PATHS.root}/${COMPONENTS_PATHS.datepicker}`,
  },
  {
    title: 'Timepicker',
    link: `${COMPONENTS_PATHS.root}/${COMPONENTS_PATHS.timepicker}`,
  },
  {
    title: 'Dialog',
    link: `${COMPONENTS_PATHS.root}/${COMPONENTS_PATHS.dialog}`,
  },
  {
    title: 'Form Field',
    link: `${COMPONENTS_PATHS.root}/${COMPONENTS_PATHS.formField}`,
  },
  {
    title: 'Input',
    link: `${COMPONENTS_PATHS.root}/${COMPONENTS_PATHS.input}`,
  },
  {
    title: 'Label',
    link: `${COMPONENTS_PATHS.root}/${COMPONENTS_PATHS.label}`,
  },
  {
    title: 'Radio',
    link: `${COMPONENTS_PATHS.root}/${COMPONENTS_PATHS.radio}`,
  },
  {
    title: 'Table',
    link: `${COMPONENTS_PATHS.root}/${COMPONENTS_PATHS.table}`,
  },
]

export const COMPONENTS_MENU = new InjectionToken('COMPONENTS_MENU', {
  factory: (): MenuItem[] => COMPONENTS_MENU_RAW,
})
