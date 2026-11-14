import { optionsFromDataset } from '../vanilla/dataset'
import { autocomplete } from '../vanilla/render'
import type { AutocompleteController, AutocompleteOptions } from '../core/types'
import { available } from './available'

export const MOUNT_SELECTOR = 'input[data-autocomplete]'

export interface MountAutocompleteOptions {
  /** Options merged under every input's data attributes, e.g. `renderOption`. */
  defaults?: Partial<AutocompleteOptions<unknown>>
}

const mounted = new Map<HTMLInputElement, AutocompleteController<unknown>>()
let observer: MutationObserver | null = null
let defaults: Partial<AutocompleteOptions<unknown>> = {}
let isMounted = false

const enhance = (input: HTMLInputElement): void => {
  if (mounted.has(input)) return
  try {
    const controller = autocomplete(input, { ...defaults, ...optionsFromDataset(input) })
    mounted.set(input, controller)
    // Inputs with an id join the shared registry, so getAutocomplete(id) finds them.
    if (input.id && !available[input.id]) available[input.id] = controller
  } catch (error) {
    console.error('Autocomplete could not mount', input, error)
  }
}

const release = (input: HTMLInputElement): void => {
  const controller = mounted.get(input)
  if (!controller) return
  mounted.delete(input)
  if (input.id && available[input.id] === controller) delete available[input.id]
  controller.destroy()
}

const inputsIn = (node: Node): HTMLInputElement[] => {
  if (!(node instanceof Element)) return []
  const inputs = Array.from(node.querySelectorAll<HTMLInputElement>(MOUNT_SELECTOR))
  return node.matches(MOUNT_SELECTOR) ? [node as HTMLInputElement, ...inputs] : inputs
}

const scan = (): void => {
  document.querySelectorAll<HTMLInputElement>(MOUNT_SELECTOR).forEach(enhance)
}

const handleMutations = (mutations: MutationRecord[]): void => {
  for (const mutation of mutations) {
    mutation.removedNodes.forEach(node =>
      inputsIn(node).forEach(input => {
        if (!input.isConnected) release(input)
      })
    )
    mutation.addedNodes.forEach(node => inputsIn(node).forEach(enhance))
  }
}

const handleReady = (): void => {
  if (!isMounted) return
  scan()
  if (typeof MutationObserver !== 'undefined' && document.body && !observer) {
    observer = new MutationObserver(handleMutations)
    observer.observe(document.body, { childList: true, subtree: true })
  }
}

/**
 * Enhances every `input[data-autocomplete]` now and as inputs are added,
 * and destroys them when they leave the document.
 */
export const mount = (options: MountAutocompleteOptions = {}): void => {
  if (typeof document === 'undefined') return
  defaults = options.defaults ?? {}
  isMounted = true
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleReady, { once: true })
  } else handleReady()
}

/** Re-scans the document for inputs added without a MutationObserver. */
export const refresh = (): void => {
  if (isMounted && typeof document !== 'undefined') scan()
}

/** Stops observing and destroys every mounted controller. */
export const unmount = (): void => {
  isMounted = false
  if (typeof document !== 'undefined') {
    document.removeEventListener('DOMContentLoaded', handleReady)
  }
  observer?.disconnect()
  observer = null
  Array.from(mounted.keys()).forEach(release)
}

/** The controllers created by `mount()`, by input. */
export const getMounted = (): ReadonlyMap<HTMLInputElement, AutocompleteController<unknown>> =>
  new Map(mounted)
