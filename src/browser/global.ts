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

export const browser = Autocomplete
export const autocomplete = Autocomplete.autocomplete
export const newAutocomplete = Autocomplete.newAutocomplete
export const getAutocomplete = Autocomplete.getAutocomplete
export const getAutocompletes = Autocomplete.getAutocompletes
export const destroyAutocomplete = Autocomplete.destroyAutocomplete
export const destroyAutocompletes = Autocomplete.destroyAutocompletes
export const available = Autocomplete.available
export default Autocomplete
