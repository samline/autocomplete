import { autocomplete } from '../vanilla/render'
import { available, type AutocompleteAvailable } from './available'
import { getMounted, mount, refresh, unmount } from './mount'
import type { AutocompleteController, AutocompleteOptions } from '../core/types'

export interface NewAutocompleteInput<T = unknown> {
  /** The id of the input to enhance. */
  id: string
  options: AutocompleteOptions<T>
}
export type { AutocompleteAvailable }
export interface AutocompleteApi {
  autocomplete: typeof autocomplete
  newAutocomplete: <T = unknown>(input: NewAutocompleteInput<T>) => AutocompleteController<T> | null
  getAutocomplete: <T = unknown>(id: string) => AutocompleteController<T> | null
  getAutocompletes: () => Readonly<Record<string, AutocompleteController<unknown>>>
  destroyAutocomplete: (target: string | HTMLInputElement) => void
  destroyAutocompletes: () => void
  available: AutocompleteAvailable
  mount: typeof mount
  unmount: typeof unmount
  refresh: typeof refresh
  getMounted: typeof getMounted
}

export { available }

const removeRegistration = (id: string): void => {
  const entry = available[id]
  if (!entry) return
  delete available[id]
  entry.destroy()
}

export const newAutocomplete = <T = unknown>({
  id,
  options,
}: NewAutocompleteInput<T>): AutocompleteController<T> | null => {
  if (!id) {
    console.error('Autocomplete ID is required')
    return null
  }
  const input = document.getElementById(id)
  if (!(input instanceof HTMLInputElement)) {
    console.warn(`Autocomplete input with ID ${id} not found`)
    return null
  }
  removeRegistration(id)
  const controller = autocomplete(input, options)
  // A direct controller.destroy() must not leave a stale registry entry.
  const destroy = controller.destroy
  const registered: AutocompleteController<T> = {
    ...controller,
    destroy: () => {
      if (available[id] === (registered as AutocompleteController<unknown>)) delete available[id]
      destroy()
    },
  }
  available[id] = registered as AutocompleteController<unknown>
  return registered
}

export const getAutocomplete = <T = unknown>(id: string): AutocompleteController<T> | null =>
  (available[id] as AutocompleteController<T> | undefined) ?? null

export const getAutocompletes = (): Readonly<Record<string, AutocompleteController<unknown>>> => ({
  ...available,
})

export const destroyAutocomplete = (target: string | HTMLInputElement): void => {
  if (typeof target === 'string') return removeRegistration(target)
  const entry = Object.entries(available).find(([, controller]) => controller.element === target)
  if (entry) removeRegistration(entry[0])
}

export const destroyAutocompletes = (): void => Object.keys(available).forEach(removeRegistration)

export const Autocomplete: AutocompleteApi = {
  autocomplete,
  newAutocomplete,
  getAutocomplete,
  getAutocompletes,
  destroyAutocomplete,
  destroyAutocompletes,
  available,
  mount,
  unmount,
  refresh,
  getMounted,
}
export const browser = Autocomplete
