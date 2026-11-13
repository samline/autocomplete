import { browser, type AutocompleteApi } from './registry'

declare global {
  interface Window {
    Autocomplete?: AutocompleteApi
  }
}

const Autocomplete: AutocompleteApi = browser

if (typeof globalThis !== 'undefined') {
  ;(globalThis as typeof globalThis & { Autocomplete: AutocompleteApi }).Autocomplete = Autocomplete
}

if (typeof window !== 'undefined' && (window as typeof globalThis) !== globalThis) {
  ;(window as { Autocomplete?: AutocompleteApi }).Autocomplete = Autocomplete
}

export default Autocomplete
