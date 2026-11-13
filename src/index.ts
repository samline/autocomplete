export { autocomplete, createAutocomplete } from './api/create-autocomplete'
export { browser } from './browser/registry'
export type { AutocompleteApi, AutocompleteAvailable } from './browser/registry'
export { createAutocompleteController, mapCommonResponse, parseJsonResponse } from './core'
export type {
  AutocompleteController,
  AutocompleteEndpoint,
  AutocompleteErrorDetail,
  AutocompleteLoadDetail,
  AutocompleteMessages,
  AutocompleteOptions,
  AutocompleteParser,
  AutocompleteRequestInit,
  AutocompleteResponseMapper,
  AutocompleteSelectDetail,
  AutocompleteTarget
} from './core'
