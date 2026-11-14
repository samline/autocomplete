// Side-effect free: importing the package never touches `window`.
// Load `@samline/autocomplete/browser/global` for `window.Autocomplete`.
export * from './core'
export * from './vanilla'
export { Autocomplete, browser } from './browser/registry'
export type {
  AutocompleteApi,
  AutocompleteAvailable,
  NewAutocompleteInput,
} from './browser/registry'
export * from './constants'
