export {
  Autocomplete,
  Autocomplete as default,
  available,
  browser,
  destroyAutocomplete,
  destroyAutocompletes,
  getAutocomplete,
  getAutocompletes,
  newAutocomplete,
} from './registry'
export { getMounted, mount, MOUNT_SELECTOR, refresh, unmount } from './mount'
export type { MountAutocompleteOptions } from './mount'
export type { AutocompleteApi, AutocompleteAvailable, NewAutocompleteInput } from './registry'
export type { AutocompleteController, AutocompleteOptions, AutocompleteTarget } from '../core/types'
