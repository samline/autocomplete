// Standalone IIFE entry (`dist/browser/global.global.js`).
// tsup assigns this module's named exports to `window.Autocomplete` through
// `globalName`, so the global has exactly the documented shape:
// { autocomplete, create, destroy, available }. Do not add a default export or
// assign the global here: the IIFE would overwrite it with the module namespace.
import { browser, type AutocompleteApi } from './registry'

declare global {
  interface Window {
    Autocomplete?: AutocompleteApi
  }
}

export const { autocomplete, create, destroy, available } = browser
