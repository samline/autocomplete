import { createAutocomplete } from '../api/create-autocomplete'
import { resolveInput } from '../core/dom'
import type { AutocompleteController, AutocompleteOptions, AutocompleteTarget } from '../core/types'

export type AutocompleteAvailable = Record<string, AutocompleteController<unknown>>

export interface AutocompleteApi {
  autocomplete: typeof createAutocomplete
  create: <T>(
    target: AutocompleteTarget,
    options: AutocompleteOptions<T>
  ) => AutocompleteController<T>
  destroy: (id: string) => void
  available: AutocompleteAvailable
}

export const available: AutocompleteAvailable = Object.create(null) as AutocompleteAvailable

function create<T>(
  target: AutocompleteTarget,
  options: AutocompleteOptions<T>
): AutocompleteController<T> {
  const input = resolveInput(target)
  if (!input.id) throw new TypeError('Autocomplete.create requires an input with an id.')

  available[input.id]?.destroy()
  const controller = createAutocomplete(input, options)
  available[input.id] = controller as AutocompleteController<unknown>
  return controller
}

function destroy(id: string): void {
  available[id]?.destroy()
  delete available[id]
}

export const browser: AutocompleteApi = {
  autocomplete: createAutocomplete,
  create,
  destroy,
  available,
}
