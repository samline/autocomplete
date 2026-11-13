import type { AutocompleteTarget } from './types'

export function resolveInput(target: AutocompleteTarget): HTMLInputElement {
  const element = typeof target === 'string' ? document.querySelector(target) : target

  if (!(element instanceof HTMLInputElement)) {
    throw new TypeError('Autocomplete requires an HTMLInputElement or a valid selector.')
  }

  return element
}

export function sanitizeId(value: unknown): string {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, '-')
}

export function restoreAttribute(element: HTMLElement, name: string, value: string | null): void {
  if (value === null) {
    element.removeAttribute(name)
    return
  }

  element.setAttribute(name, value)
}
