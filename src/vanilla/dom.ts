import { HIGHLIGHT_ATTRIBUTE } from '../constants'
import type { AutocompleteHighlightPart, AutocompleteTarget } from '../core/types'

export const resolveInput = (target: AutocompleteTarget): HTMLInputElement => {
  const element = typeof target === 'string' ? document.querySelector(target) : target

  if (!(element instanceof HTMLInputElement)) {
    throw new TypeError('Autocomplete requires an HTMLInputElement or a valid selector.')
  }

  return element
}

export const sanitizeId = (value: unknown): string => String(value).replace(/[^a-zA-Z0-9_-]/g, '-')

export const restoreAttribute = (
  element: HTMLElement,
  name: string,
  value: string | null
): void => {
  if (value === null) element.removeAttribute(name)
  else element.setAttribute(name, value)
}

/**
 * Appends highlight parts to `element` as text nodes and
 * `<mark data-autocomplete-highlight>` elements. Text is never parsed as HTML.
 */
export const renderHighlight = (
  element: HTMLElement,
  parts: readonly AutocompleteHighlightPart[]
): void => {
  for (const part of parts) {
    if (!part.match) {
      element.append(document.createTextNode(part.text))
      continue
    }

    const mark = document.createElement('mark')
    mark.setAttribute(HIGHLIGHT_ATTRIBUTE, '')
    mark.textContent = part.text
    element.append(mark)
  }
}

// Keeps the live region readable by screen readers but out of the layout,
// so it works without the optional stylesheet.
export const VISUALLY_HIDDEN =
  'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0'
