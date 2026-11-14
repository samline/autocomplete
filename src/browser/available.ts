import type { AutocompleteController } from '../core/types'

export interface AutocompleteAvailable {
  [id: string]: AutocompleteController<unknown>
}

/** Registered controllers by input id, shared by the registry and `mount()`. */
export const available: AutocompleteAvailable = Object.create(null) as AutocompleteAvailable
