import { createAutocompleteController } from '../core/controller'
import type { AutocompleteController, AutocompleteOptions, AutocompleteTarget } from '../core/types'

export function createAutocomplete<T = unknown>(
  target: AutocompleteTarget,
  options: AutocompleteOptions<T>
): AutocompleteController<T> {
  return createAutocompleteController(target, options)
}

export const autocomplete = createAutocomplete
