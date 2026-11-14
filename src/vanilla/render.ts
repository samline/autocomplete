import {
  DEFAULT_DEBOUNCE,
  DEFAULT_MAX_RESULTS,
  DEFAULT_MIN_LENGTH,
  LIST_ATTRIBUTE,
  LIVE_ATTRIBUTE,
  OPTION_ATTRIBUTE,
  POPUP_ATTRIBUTE,
  STATUS_ATTRIBUTE,
} from '../constants'
import { createCache } from '../core/cache'
import { fromEndpoint } from '../core/source'
import {
  DEFAULT_MESSAGES,
  getDefaultId,
  getDefaultLabel,
  getDefaultValue,
  resolveMessage,
  validateOptions,
} from '../core/state'
import { filterSuggestions, highlight, normalizeText } from '../core/text'
import type {
  AutocompleteController,
  AutocompleteEndpointOptions,
  AutocompleteHighlightPart,
  AutocompleteMessages,
  AutocompleteOptions,
  AutocompleteSourceFunction,
  AutocompleteTarget,
} from '../core/types'
import { renderHighlight, resolveInput, restoreAttribute, sanitizeId, VISUALLY_HIDDEN } from './dom'

interface NormalizedSuggestion<T> {
  id: string
  label: string
  value: string
  data: T
}

type StatusState = 'loading' | 'empty' | 'error'

const RESTORED_ATTRIBUTES = [
  'role',
  'autocomplete',
  'aria-autocomplete',
  'aria-controls',
  'aria-expanded',
  'aria-activedescendant',
] as const

let instanceCount = 0

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError'

/** Turns an existing text input into an accessible combobox. */
export const autocomplete = <T = unknown>(
  target: AutocompleteTarget,
  options: AutocompleteOptions<T>
): AutocompleteController<T> => {
  validateOptions(options)

  const input = resolveInput(target)
  const instanceId = `autocomplete-${++instanceCount}`
  const messages: AutocompleteMessages = { ...DEFAULT_MESSAGES, ...options.messages }
  const localSuggestions = Array.isArray(options.source) ? (options.source as readonly T[]) : null
  const getLabel = options.getLabel ?? (getDefaultLabel as (suggestion: T) => string)
  const getValue = options.getValue ?? (getDefaultValue as (suggestion: T) => string)
  const getId = options.getId ?? (getDefaultId as (suggestion: T, index: number) => string | number)
  const normalize = options.normalize ?? normalizeText
  const minLength = options.minLength ?? (localSuggestions ? 1 : DEFAULT_MIN_LENGTH)
  const debounce = options.debounce ?? (localSuggestions ? 0 : DEFAULT_DEBOUNCE)
  const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS
  const searchOnFocus = options.searchOnFocus ?? true
  const highlightEnabled = options.highlight ?? true

  const source: AutocompleteSourceFunction<T> | null = localSuggestions
    ? null
    : typeof options.source === 'function'
      ? options.source
      : fromEndpoint(options as AutocompleteEndpointOptions<T>)
  const cache =
    source && options.cache !== false
      ? createCache<T>(typeof options.cache === 'object' ? options.cache : {})
      : null

  const popup = document.createElement('div')
  const list = document.createElement('div')
  const status = document.createElement('div')
  const live = document.createElement('div')
  const originalAttributes = new Map<string, string | null>()
  const label = input.labels?.[0] ?? null
  const originalLabelId = label?.getAttribute('id') ?? null

  let suggestions: NormalizedSuggestion<T>[] = []
  let activeIndex = -1
  let selected: T | null = null
  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  let abortController: AbortController | null = null
  let requestSequence = 0
  let destroyed = false
  let suppressFocusSearch = false

  popup.hidden = true
  popup.setAttribute(POPUP_ATTRIBUTE, '')

  list.id = `${instanceId}-listbox`
  list.hidden = true
  list.role = 'listbox'
  list.setAttribute(LIST_ATTRIBUTE, '')

  // The live region announces the status; the visible copy is not read twice.
  status.hidden = true
  status.setAttribute(STATUS_ATTRIBUTE, '')
  status.setAttribute('aria-hidden', 'true')

  live.role = 'status'
  live.setAttribute('aria-live', 'polite')
  live.setAttribute('aria-atomic', 'true')
  live.setAttribute(LIVE_ATTRIBUTE, '')
  live.style.cssText = VISUALLY_HIDDEN

  if (label) {
    if (!label.id) label.id = `${instanceId}-label`
    list.setAttribute('aria-labelledby', label.id)
  }

  for (const name of RESTORED_ATTRIBUTES) originalAttributes.set(name, input.getAttribute(name))

  input.role = 'combobox'
  input.autocomplete = 'off'
  input.setAttribute('aria-autocomplete', 'list')
  input.setAttribute('aria-controls', list.id)
  input.setAttribute('aria-expanded', 'false')

  popup.append(list, status)
  input.insertAdjacentElement('afterend', popup)
  popup.insertAdjacentElement('afterend', live)

  const dispatch = (name: string, detail: object): void => {
    input.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }))
  }

  const announce = (message: string): void => {
    live.textContent = message
  }

  const cancel = (): void => {
    clearTimeout(debounceTimer)
    debounceTimer = undefined
    requestSequence += 1
    abortController?.abort()
    abortController = null
  }

  const updateActiveOption = (): void => {
    const elements = list.querySelectorAll<HTMLElement>(`[${OPTION_ATTRIBUTE}]`)

    elements.forEach((element, index) => {
      const active = index === activeIndex
      element.dataset.active = String(active)
      element.setAttribute('aria-selected', String(active))
    })

    const active = elements.item(activeIndex)
    if (!active) {
      input.removeAttribute('aria-activedescendant')
      return
    }

    input.setAttribute('aria-activedescendant', active.id)
    active.scrollIntoView({ block: 'nearest' })
  }

  const close = (): void => {
    activeIndex = -1
    popup.hidden = true
    list.hidden = true
    status.hidden = true
    input.setAttribute('aria-expanded', 'false')
    input.removeAttribute('aria-activedescendant')
    updateActiveOption()
  }

  // Closing is a user decision: drop the pending search and abort the request
  // in flight, otherwise its response would reopen the list.
  const dismiss = (): void => {
    cancel()
    close()
  }

  const renderStatus = (state: StatusState, query: string): void => {
    if (destroyed) return

    const message = resolveMessage(messages[state], { query, count: 0 })
    list.replaceChildren()
    list.hidden = true
    status.textContent = message
    status.setAttribute(STATUS_ATTRIBUTE, state)
    status.hidden = false
    popup.hidden = false
    input.setAttribute('aria-expanded', 'false')
    input.removeAttribute('aria-activedescendant')
    if (state !== 'loading') announce(message)
  }

  const select = (index: number): void => {
    const suggestion = suggestions[index]
    if (!suggestion) return

    selected = suggestion.data
    input.value = suggestion.value
    dismiss()
    dispatch('autocomplete:select', {
      suggestion: suggestion.data,
      label: suggestion.label,
      value: suggestion.value,
    })
    options.onSelect?.(suggestion.data, input)
  }

  const handleOptionPointerDown = (event: PointerEvent): void => {
    event.preventDefault()
    select(Number((event.currentTarget as HTMLElement).dataset.index))

    if (document.activeElement !== input) {
      suppressFocusSearch = true
      input.focus({ preventScroll: true })
      suppressFocusSearch = false
    }
  }

  const handleOptionPointerEnter = (event: PointerEvent): void => {
    activeIndex = Number((event.currentTarget as HTMLElement).dataset.index)
    updateActiveOption()
  }

  const renderSuggestions = (query: string): void => {
    const fragment = document.createDocumentFragment()

    suggestions.forEach((suggestion, index) => {
      const option = document.createElement('div')
      const parts: AutocompleteHighlightPart[] = highlightEnabled
        ? highlight(suggestion.label, query, normalize)
        : [{ text: suggestion.label, match: false }]

      option.id = suggestion.id
      option.role = 'option'
      option.setAttribute(OPTION_ATTRIBUTE, '')
      option.dataset.index = String(index)
      option.setAttribute('aria-selected', 'false')
      renderHighlight(option, parts)
      options.renderOption?.(option, suggestion.data, {
        query,
        index,
        label: suggestion.label,
        highlight: parts,
      })
      option.addEventListener('pointerdown', handleOptionPointerDown)
      option.addEventListener('pointerenter', handleOptionPointerEnter)
      fragment.append(option)
    })

    list.replaceChildren(fragment)
    list.hidden = false
    status.hidden = true
    popup.hidden = false
    input.setAttribute('aria-expanded', 'true')
  }

  const normalizeSuggestion = (suggestion: T, index: number): NormalizedSuggestion<T> => ({
    id: `${instanceId}-option-${sanitizeId(getId(suggestion, index))}`,
    label: String(getLabel(suggestion)),
    value: String(getValue(suggestion)),
    data: suggestion,
  })

  const showResults = (query: string, result: readonly T[], cached: boolean): void => {
    if (destroyed) return

    suggestions = result.slice(0, maxResults).map(normalizeSuggestion)
    activeIndex = -1

    if (suggestions.length === 0) renderStatus('empty', query)
    else {
      renderSuggestions(query)
      announce(resolveMessage(messages.results, { query, count: suggestions.length }))
    }

    dispatch('autocomplete:load', {
      query,
      suggestions: suggestions.map(suggestion => suggestion.data),
      cached,
    })
  }

  const filterLocal = (items: readonly T[], query: string): T[] => {
    const filter = options.filter
    return filter
      ? items.filter(item => filter(item, query))
      : filterSuggestions(items, query, { getText: getLabel, normalize })
  }

  const search = async (query: string = input.value.trim()): Promise<void> => {
    if (destroyed || query.length < minLength) {
      close()
      return
    }

    cancel()
    const sequence = ++requestSequence

    if (localSuggestions) {
      showResults(query, filterLocal(localSuggestions, query), false)
      return
    }

    const hit = cache?.get(query)
    if (hit) {
      showResults(query, hit, true)
      return
    }

    const controller = new AbortController()
    abortController = controller
    renderStatus('loading', query)
    dispatch('autocomplete:loadstart', { query })

    try {
      const result = await source!(query, { signal: controller.signal, input })
      if (!Array.isArray(result)) throw new TypeError('Autocomplete source must return an array.')
      if (sequence !== requestSequence) return

      cache?.set(query, result)
      showResults(query, result, false)
    } catch (error) {
      if (isAbortError(error) || sequence !== requestSequence || destroyed) return

      suggestions = []
      activeIndex = -1
      renderStatus('error', query)
      dispatch('autocomplete:error', { query, error })
      options.onError?.(error, input)
    } finally {
      if (sequence === requestSequence) abortController = null
    }
  }

  const scheduleSearch = (): void => {
    clearTimeout(debounceTimer)
    const query = input.value.trim()

    if (selected !== null) {
      selected = null
      dispatch('autocomplete:clear', { query })
    }

    if (query.length < minLength) {
      dismiss()
      return
    }

    if (debounce === 0) {
      void search(query)
      return
    }

    debounceTimer = setTimeout(() => void search(query), debounce)
  }

  const clear = (): void => {
    const hadSelection = selected !== null
    cancel()
    suggestions = []
    activeIndex = -1
    selected = null
    input.value = ''
    close()
    announce('')
    if (hadSelection) dispatch('autocomplete:clear', { query: '' })
  }

  const moveActiveOption = (direction: number): void => {
    if (list.hidden || suggestions.length === 0) return

    activeIndex =
      activeIndex === -1
        ? direction > 0
          ? 0
          : suggestions.length - 1
        : (activeIndex + direction + suggestions.length) % suggestions.length

    updateActiveOption()
  }

  const handleInput = (event: Event): void => {
    // Wait for IME composition to finish (compositionend schedules the search).
    if ((event as InputEvent).isComposing) return
    scheduleSearch()
  }

  const handleFocus = (): void => {
    if (suppressFocusSearch) return
    if (searchOnFocus && input.value.trim().length >= minLength) scheduleSearch()
  }

  const handleKeydown = (event: KeyboardEvent): void => {
    const listOpen = !list.hidden && suggestions.length > 0

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!listOpen) return
      event.preventDefault()
      moveActiveOption(event.key === 'ArrowDown' ? 1 : -1)
      return
    }

    if (event.key === 'Enter' && listOpen && activeIndex >= 0) {
      event.preventDefault()
      select(activeIndex)
      return
    }

    if ((event.key === 'Home' || event.key === 'End') && listOpen) {
      event.preventDefault()
      activeIndex = event.key === 'Home' ? 0 : suggestions.length - 1
      updateActiveOption()
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      dismiss()
      return
    }

    if (event.key === 'Tab') dismiss()
  }

  const handleDocumentPointerDown = (event: PointerEvent): void => {
    if (event.target !== input && !popup.contains(event.target as Node)) dismiss()
  }

  const destroy = (): void => {
    if (destroyed) return
    destroyed = true
    cancel()
    input.removeEventListener('input', handleInput)
    input.removeEventListener('compositionend', scheduleSearch)
    input.removeEventListener('focus', handleFocus)
    input.removeEventListener('keydown', handleKeydown)
    document.removeEventListener('pointerdown', handleDocumentPointerDown)
    popup.remove()
    live.remove()
    cache?.clear()

    originalAttributes.forEach((value, name) => restoreAttribute(input, name, value))
    if (label) restoreAttribute(label, 'id', originalLabelId)
  }

  input.addEventListener('input', handleInput)
  input.addEventListener('compositionend', scheduleSearch)
  input.addEventListener('focus', handleFocus)
  input.addEventListener('keydown', handleKeydown)
  document.addEventListener('pointerdown', handleDocumentPointerDown)

  return {
    element: input,
    popupElement: popup,
    listElement: list,
    statusElement: status,
    liveElement: live,
    options,
    search,
    close: dismiss,
    clear,
    cancel,
    clearCache: () => cache?.clear(),
    getSelected: () => selected,
    destroy,
  }
}

export const createAutocomplete = autocomplete
