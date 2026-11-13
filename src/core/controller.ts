import {
  DEFAULT_MESSAGES,
  getDefaultId,
  getDefaultLabel,
  getDefaultValue,
  mapCommonResponse,
  parseJsonResponse,
  validateOptions
} from './defaults'
import { resolveInput, restoreAttribute, sanitizeId } from './dom'
import type {
  AutocompleteController,
  AutocompleteMessages,
  AutocompleteOptions,
  AutocompleteResponseMapper,
  AutocompleteTarget,
  NormalizedSuggestion
} from './types'

let instanceCount = 0

export function createAutocompleteController<T>(
  target: AutocompleteTarget,
  options: AutocompleteOptions<T>
): AutocompleteController<T> {
  validateOptions(options)

  const input = resolveInput(target)
  const instanceId = `autocomplete-${++instanceCount}`
  const messages: AutocompleteMessages = { ...DEFAULT_MESSAGES, ...options.messages }
  const mapResponse: AutocompleteResponseMapper<T> =
    options.mapResponse ?? (mapCommonResponse as AutocompleteResponseMapper<T>)
  const settings = {
    queryParam: options.queryParam === undefined ? 'q' : options.queryParam,
    requestInit: options.requestInit ?? {},
    parseResponse: options.parseResponse ?? parseJsonResponse,
    mapResponse,
    getId: options.getId ?? (getDefaultId as (suggestion: T, index: number) => string | number),
    getLabel: options.getLabel ?? (getDefaultLabel as (suggestion: T) => string),
    getValue: options.getValue ?? (getDefaultValue as (suggestion: T) => string),
    renderOption: options.renderOption,
    minLength: options.minLength ?? 2,
    debounce: options.debounce ?? 250,
    maxResults: options.maxResults ?? 8,
    searchOnFocus: options.searchOnFocus ?? true,
    onSelect: options.onSelect,
    onError: options.onError
  }
  const list = document.createElement('div')
  const originalAttributes = new Map<string, string | null>()

  let suggestions: NormalizedSuggestion<T>[] = []
  let activeIndex = -1
  let selected: T | null = null
  let debounceTimer: number | undefined
  let abortController: AbortController | null = null
  let requestSequence = 0
  let destroyed = false
  let suppressFocusSearch = false

  list.id = `${instanceId}-listbox`
  list.hidden = true
  list.role = 'listbox'
  list.dataset.autocompleteList = ''

  for (const name of [
    'role',
    'autocomplete',
    'aria-autocomplete',
    'aria-controls',
    'aria-expanded',
    'aria-activedescendant'
  ]) {
    originalAttributes.set(name, input.getAttribute(name))
  }

  input.role = 'combobox'
  input.autocomplete = 'off'
  input.setAttribute('aria-autocomplete', 'list')
  input.setAttribute('aria-controls', list.id)
  input.setAttribute('aria-expanded', 'false')
  input.insertAdjacentElement('afterend', list)

  function buildUrl(query: string): URL {
    const endpoint =
      typeof options.endpoint === 'function' ? options.endpoint(query, input) : options.endpoint
    const url = new URL(endpoint, document.baseURI)

    if (settings.queryParam !== null) url.searchParams.set(settings.queryParam, query)
    return url
  }

  function buildRequestInit(query: string, signal: AbortSignal): RequestInit {
    const init =
      typeof settings.requestInit === 'function'
        ? settings.requestInit(query, input)
        : settings.requestInit

    return { ...init, signal }
  }

  function handleInput(event: Event): void {
    // Wait for IME composition to finish (compositionend schedules the search).
    if ((event as InputEvent).isComposing) return
    scheduleSearch()
  }

  function scheduleSearch(): void {
    window.clearTimeout(debounceTimer)
    const query = input.value.trim()

    if (selected !== null) {
      selected = null
      dispatch('autocomplete:clear', { query })
    }

    if (query.length < settings.minLength) {
      cancel()
      close()
      return
    }

    debounceTimer = window.setTimeout(() => void search(query), settings.debounce)
  }

  async function search(query = input.value.trim()): Promise<void> {
    if (destroyed || query.length < settings.minLength) {
      close()
      return
    }

    cancel()
    const sequence = ++requestSequence
    const controller = new AbortController()
    abortController = controller

    renderStatus(messages.loading, 'status', 'loading')
    dispatch('autocomplete:loadstart', { query })

    try {
      const response = await fetch(buildUrl(query), buildRequestInit(query, controller.signal))
      if (!response.ok) throw new Error(`Autocomplete request failed with HTTP ${response.status}.`)

      const payload = await settings.parseResponse(response, query)
      const result = await settings.mapResponse(payload, response, query)
      if (!Array.isArray(result))
        throw new TypeError('Autocomplete mapResponse must return an array.')
      if (sequence !== requestSequence) return

      suggestions = result.slice(0, settings.maxResults).map(normalizeSuggestion)
      activeIndex = -1

      if (suggestions.length === 0) renderStatus(messages.empty, 'status', 'empty')
      else renderSuggestions()

      dispatch('autocomplete:load', {
        query,
        suggestions: suggestions.map((suggestion) => suggestion.data)
      })
    } catch (error) {
      if (isAbortError(error) || sequence !== requestSequence) return

      suggestions = []
      activeIndex = -1
      renderStatus(messages.error, 'alert', 'error')
      dispatch('autocomplete:error', { query, error })
      settings.onError?.(error, input)
    } finally {
      if (sequence === requestSequence) abortController = null
    }
  }

  function normalizeSuggestion(suggestion: T, index: number): NormalizedSuggestion<T> {
    return {
      id: `${instanceId}-option-${sanitizeId(settings.getId(suggestion, index))}`,
      label: String(settings.getLabel(suggestion)),
      value: String(settings.getValue(suggestion)),
      data: suggestion
    }
  }

  function renderSuggestions(): void {
    const fragment = document.createDocumentFragment()
    list.replaceChildren()

    suggestions.forEach((suggestion, index) => {
      const option = document.createElement('button')
      option.id = suggestion.id
      option.type = 'button'
      option.role = 'option'
      option.textContent = suggestion.label
      option.dataset.autocompleteOption = ''
      option.dataset.index = String(index)
      option.setAttribute('aria-selected', 'false')
      settings.renderOption?.(option, suggestion.data)
      option.addEventListener('pointerdown', handleOptionPointerDown)
      option.addEventListener('pointerenter', handleOptionPointerEnter)
      fragment.append(option)
    })

    list.append(fragment)
    open()
  }

  function renderStatus(message: string, role: 'status' | 'alert', state: string): void {
    const element = document.createElement('div')
    element.role = role
    element.textContent = message
    element.dataset.autocompleteStatus = state
    list.replaceChildren(element)
    open(true)
  }

  function open(allowStatus = false): void {
    if (destroyed || (!allowStatus && suggestions.length === 0)) return
    list.hidden = false
    input.setAttribute('aria-expanded', 'true')
  }

  function close(): void {
    activeIndex = -1
    list.hidden = true
    input.setAttribute('aria-expanded', 'false')
    input.removeAttribute('aria-activedescendant')
    updateActiveOption()
  }

  // Closing is a user decision: drop the pending search and abort the request
  // in flight, otherwise their response would reopen the list.
  function dismiss(): void {
    cancel()
    close()
  }

  function clear(): void {
    const hadSelection = selected !== null
    cancel()
    suggestions = []
    activeIndex = -1
    selected = null
    input.value = ''
    close()
    if (hadSelection) dispatch('autocomplete:clear', { query: '' })
  }

  function moveActiveOption(direction: number): void {
    if (list.hidden || suggestions.length === 0) return

    activeIndex =
      activeIndex === -1
        ? direction > 0
          ? 0
          : suggestions.length - 1
        : (activeIndex + direction + suggestions.length) % suggestions.length

    updateActiveOption()
  }

  function updateActiveOption(): void {
    const options = list.querySelectorAll<HTMLButtonElement>('[data-autocomplete-option]')

    options.forEach((option, index) => {
      const active = index === activeIndex
      option.dataset.active = String(active)
      option.setAttribute('aria-selected', String(active))
    })

    const active = options.item(activeIndex)
    if (!active) {
      input.removeAttribute('aria-activedescendant')
      return
    }

    input.setAttribute('aria-activedescendant', active.id)
    active.scrollIntoView({ block: 'nearest' })
  }

  function select(index: number): void {
    const suggestion = suggestions[index]
    if (!suggestion) return

    selected = suggestion.data
    input.value = suggestion.value
    dismiss()
    dispatch('autocomplete:select', {
      suggestion: suggestion.data,
      label: suggestion.label,
      value: suggestion.value
    })
    settings.onSelect?.(suggestion.data, input)
  }

  function dispatch(name: string, detail: object): void {
    input.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }))
  }

  function cancel(): void {
    window.clearTimeout(debounceTimer)
    debounceTimer = undefined
    requestSequence += 1
    abortController?.abort()
    abortController = null
  }

  function handleFocus(): void {
    if (suppressFocusSearch) return

    if (settings.searchOnFocus && input.value.trim().length >= settings.minLength) {
      scheduleSearch()
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (suggestions.length === 0 || list.hidden) return
      event.preventDefault()
      moveActiveOption(event.key === 'ArrowDown' ? 1 : -1)
      return
    }

    if (event.key === 'Enter' && !list.hidden && activeIndex >= 0) {
      event.preventDefault()
      select(activeIndex)
      return
    }

    if ((event.key === 'Home' || event.key === 'End') && !list.hidden && suggestions.length > 0) {
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

  function handleOptionPointerDown(event: PointerEvent): void {
    event.preventDefault()
    const element = event.currentTarget as HTMLButtonElement
    select(Number(element.dataset.index))

    if (document.activeElement !== input) {
      suppressFocusSearch = true
      input.focus({ preventScroll: true })
      suppressFocusSearch = false
    }
  }

  function handleOptionPointerEnter(event: PointerEvent): void {
    const element = event.currentTarget as HTMLButtonElement
    activeIndex = Number(element.dataset.index)
    updateActiveOption()
  }

  function handleDocumentPointerDown(event: PointerEvent): void {
    if (event.target !== input && !list.contains(event.target as Node)) dismiss()
  }

  function destroy(): void {
    if (destroyed) return
    destroyed = true
    cancel()
    input.removeEventListener('input', handleInput)
    input.removeEventListener('compositionend', scheduleSearch)
    input.removeEventListener('focus', handleFocus)
    input.removeEventListener('keydown', handleKeydown)
    document.removeEventListener('pointerdown', handleDocumentPointerDown)
    list.remove()

    originalAttributes.forEach((value, name) => restoreAttribute(input, name, value))
  }

  input.addEventListener('input', handleInput)
  input.addEventListener('compositionend', scheduleSearch)
  input.addEventListener('focus', handleFocus)
  input.addEventListener('keydown', handleKeydown)
  document.addEventListener('pointerdown', handleDocumentPointerDown)

  return {
    element: input,
    listElement: list,
    options,
    search,
    close: dismiss,
    clear,
    cancel,
    getSelected: () => selected,
    destroy
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}
