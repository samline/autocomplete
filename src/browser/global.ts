import { Autocomplete } from './registry'
import type { AutocompleteApi } from './registry'

declare global {
  interface Window {
    Autocomplete: AutocompleteApi
  }
}

if (typeof globalThis !== 'undefined') {
  ;(globalThis as typeof globalThis & { Autocomplete: AutocompleteApi }).Autocomplete = Autocomplete
}

// The standalone script enhances `input[data-autocomplete]` without any code.
Autocomplete.mount()

export const browser = Autocomplete
export const autocomplete = Autocomplete.autocomplete
export const newAutocomplete = Autocomplete.newAutocomplete
export const getAutocomplete = Autocomplete.getAutocomplete
export const getAutocompletes = Autocomplete.getAutocompletes
export const destroyAutocomplete = Autocomplete.destroyAutocomplete
export const destroyAutocompletes = Autocomplete.destroyAutocompletes
export const available = Autocomplete.available
export const mount = Autocomplete.mount
export const unmount = Autocomplete.unmount
export const refresh = Autocomplete.refresh
export const getMounted = Autocomplete.getMounted
export default Autocomplete
