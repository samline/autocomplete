// Side-effect free: importing the package never touches `window`.
// Load `@samline/autocomplete/browser/global` for `window.Autocomplete`.
export * from './core'
export * from './vanilla'
export { Autocomplete, browser } from './browser/registry'
export { mount, refresh, unmount, getMounted } from './browser/mount'
export type { MountAutocompleteOptions } from './browser/mount'
export type {
  AutocompleteApi,
  AutocompleteAvailable,
  NewAutocompleteInput,
} from './browser/registry'
export * from './constants'
