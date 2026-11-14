import {
  DEFAULT_DEBOUNCE,
  DEFAULT_MAX_RESULTS,
  DEFAULT_MIN_LENGTH,
  DEFAULT_POPOVER_OFFSET,
  DEFAULT_RECENT_LABEL,
  FOOTER_ATTRIBUTE,
  GROUP_ATTRIBUTE,
  GROUP_LABEL_ATTRIBUTE,
  HEADER_ATTRIBUTE,
  HIDDEN_INPUT_ATTRIBUTE,
  LIST_ATTRIBUTE,
  LIVE_ATTRIBUTE,
  OPTION_ATTRIBUTE,
  POPUP_ATTRIBUTE,
  STATUS_ATTRIBUTE,
} from '../constants'
import { createCache } from '../core/cache'
import { createRecentStore } from '../core/recent'
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
  AutocompleteCache,
  AutocompleteCacheOptions,
  AutocompleteController,
  AutocompleteEndpointOptions,
  AutocompleteHighlightPart,
  AutocompleteMessages,
  AutocompleteOptions,
  AutocompleteRecentStore,
  AutocompleteResultsContext,
  AutocompleteSectionResult,
  AutocompleteSourceFunction,
  AutocompleteStatusState,
  AutocompleteTarget,
} from '../core/types'
import { renderHighlight, resolveInput, restoreAttribute, sanitizeId, VISUALLY_HIDDEN } from './dom'
import { createPositioner } from './position'

interface NormalizedSuggestion<T> {
  id: string
  rawId: string
  label: string
  value: string
  section: string | null
  data: T
}

interface RuntimeSection<T> {
  /** `null` for a single source or endpoint. */
  id: string | null
  label: string | undefined
  local: readonly T[] | null
  source: AutocompleteSourceFunction<T> | null
  filter: ((suggestion: T, query: string) => boolean) | undefined
  maxResults: number
  cache: AutocompleteCache<T> | null
}

interface SectionOutcome<T> {
  section: RuntimeSection<T>
  result: readonly T[]
}

const RESTORED_ATTRIBUTES = [
  'role',
  'autocomplete',
  'aria-autocomplete',
  'aria-controls',
  'aria-expanded',
  'aria-activedescendant',
] as const

const RECENT_SECTION = 'recent'

let instanceCount = 0

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError'

const resolveCache = <T>(
  setting: boolean | AutocompleteCacheOptions | undefined
): AutocompleteCache<T> | null =>
  setting === false ? null : createCache<T>(typeof setting === 'object' ? setting : {})

/** Turns an existing text input into an accessible combobox. */
export const autocomplete = <T = unknown>(
  target: AutocompleteTarget,
  options: AutocompleteOptions<T>
): AutocompleteController<T> => {
  validateOptions(options)

  const input = resolveInput(target)
  const instanceId = `autocomplete-${++instanceCount}`
  const messages: AutocompleteMessages = { ...DEFAULT_MESSAGES, ...options.messages }
  const getLabel = options.getLabel ?? (getDefaultLabel as (suggestion: T) => string)
  const getValue = options.getValue ?? (getDefaultValue as (suggestion: T) => string)
  const getId = options.getId ?? (getDefaultId as (suggestion: T, index: number) => string | number)
  const normalize = options.normalize ?? normalizeText
  const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS

  const sections: RuntimeSection<T>[] = options.sections
    ? options.sections.map(section => {
        const local = Array.isArray(section.source) ? (section.source as readonly T[]) : null
        return {
          id: section.id,
          label: section.label,
          local,
          source: local ? null : (section.source as AutocompleteSourceFunction<T>),
          filter: section.filter ?? options.filter,
          maxResults: section.maxResults ?? maxResults,
          cache: local ? null : resolveCache<T>(section.cache ?? options.cache),
        }
      })
    : [
        {
          id: null,
          label: undefined,
          local: Array.isArray(options.source) ? (options.source as readonly T[]) : null,
          source: Array.isArray(options.source)
            ? null
            : typeof options.source === 'function'
              ? options.source
              : fromEndpoint(options as AutocompleteEndpointOptions<T>),
          filter: options.filter,
          maxResults,
          cache: Array.isArray(options.source) ? null : resolveCache<T>(options.cache),
        },
      ]

  const allLocal = sections.every(section => section.local !== null)
  const minLength = options.minLength ?? (allLocal ? 1 : DEFAULT_MIN_LENGTH)
  const debounce = options.debounce ?? (allLocal ? 0 : DEFAULT_DEBOUNCE)
  const searchOnFocus = options.searchOnFocus ?? true
  const highlightEnabled = options.highlight ?? true

  const recentOptions = typeof options.recent === 'object' ? options.recent : {}
  const recent: AutocompleteRecentStore<T> | null = options.recent
    ? (recentOptions.store ??
      createRecentStore<T>({
        ...(input.id ? { key: `autocomplete:recent:${input.id}` } : {}),
        ...(recentOptions.max === undefined ? {} : { max: recentOptions.max }),
        getKey: suggestion => String(getId(suggestion, 0)),
      }))
    : null
  const recentLabel = recentOptions.label ?? DEFAULT_RECENT_LABEL

  const popup = document.createElement('div')
  const header = options.renderHeader ? document.createElement('div') : null
  const list = document.createElement('div')
  const footer = options.renderFooter ? document.createElement('div') : null
  const status = document.createElement('div')
  const live = document.createElement('div')
  const originalAttributes = new Map<string, string | null>()
  const label = input.labels?.[0] ?? null
  const originalLabelId = label?.getAttribute('id') ?? null

  const hiddenSetting =
    typeof options.hiddenInput === 'string' ? { name: options.hiddenInput } : options.hiddenInput
  const providedHidden = hiddenSetting?.element ? resolveInput(hiddenSetting.element) : null
  const hidden: HTMLInputElement | null = hiddenSetting
    ? (providedHidden ?? document.createElement('input'))
    : null
  const getHiddenValue = hiddenSetting?.getValue

  const positioner = createPositioner({
    input,
    popup,
    placement: options.placement ?? 'auto',
    popover: options.popover ?? false,
    offset: options.offset ?? DEFAULT_POPOVER_OFFSET,
  })

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

  if (header) {
    header.hidden = true
    header.setAttribute(HEADER_ATTRIBUTE, '')
  }
  if (footer) {
    footer.hidden = true
    footer.setAttribute(FOOTER_ATTRIBUTE, '')
  }

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

  popup.append(...[header, list, footer, status].filter(element => element !== null))
  input.insertAdjacentElement('afterend', popup)
  popup.insertAdjacentElement('afterend', live)

  if (hidden && !providedHidden) {
    hidden.type = 'hidden'
    hidden.name = hiddenSetting?.name ?? ''
    hidden.setAttribute(HIDDEN_INPUT_ATTRIBUTE, '')
    live.insertAdjacentElement('afterend', hidden)
  }

  const dispatch = (name: string, detail: object): void => {
    input.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }))
  }

  const announce = (message: string): void => {
    live.textContent = message
  }

  const syncHidden = (value: string): void => {
    if (!hidden || hidden.value === value) return
    hidden.value = value
    hidden.dispatchEvent(new Event('change', { bubbles: true }))
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

  const showPopup = (): void => {
    popup.hidden = false
    positioner.open()
  }

  const close = (): void => {
    activeIndex = -1
    popup.hidden = true
    list.hidden = true
    status.hidden = true
    if (header) header.hidden = true
    if (footer) footer.hidden = true
    positioner.close()
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

  const renderStatus = (state: AutocompleteStatusState, query: string, error?: unknown): void => {
    if (destroyed) return

    const message = resolveMessage(messages[state], { query, count: 0 })
    list.replaceChildren()
    list.hidden = true
    if (header) header.hidden = true
    if (footer) footer.hidden = true
    status.textContent = message
    status.setAttribute(STATUS_ATTRIBUTE, state)
    options.renderStatus?.(status, { state, query, ...(state === 'error' ? { error } : {}) })
    status.hidden = false
    input.setAttribute('aria-expanded', 'false')
    input.removeAttribute('aria-activedescendant')
    showPopup()
    if (state !== 'loading') announce(message)
  }

  const select = (index: number): void => {
    const suggestion = suggestions[index]
    if (!suggestion) return

    selected = suggestion.data
    input.value = suggestion.value
    syncHidden(getHiddenValue ? getHiddenValue(suggestion.data) : suggestion.rawId)
    recent?.add(suggestion.data)
    dismiss()
    dispatch('autocomplete:select', {
      suggestion: suggestion.data,
      label: suggestion.label,
      value: suggestion.value,
      section: suggestion.section,
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

  const createOption = (suggestion: NormalizedSuggestion<T>, index: number, query: string) => {
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
    return option
  }

  const renderList = (
    query: string,
    groups: readonly {
      id: string | null
      label: string | undefined
      items: NormalizedSuggestion<T>[]
    }[],
    context: AutocompleteResultsContext<T>
  ): void => {
    const fragment = document.createDocumentFragment()
    let index = 0

    for (const group of groups) {
      if (group.items.length === 0) continue

      const container: DocumentFragment | HTMLDivElement =
        group.label === undefined
          ? document.createDocumentFragment()
          : document.createElement('div')

      if (container instanceof HTMLDivElement && group.id !== null) {
        const heading = document.createElement('div')
        heading.id = `${instanceId}-group-${sanitizeId(group.id)}`
        heading.role = 'presentation'
        heading.textContent = group.label ?? ''
        heading.setAttribute(GROUP_LABEL_ATTRIBUTE, '')
        container.role = 'group'
        container.setAttribute(GROUP_ATTRIBUTE, group.id)
        container.setAttribute('aria-labelledby', heading.id)
        container.append(heading)
      }

      for (const item of group.items) container.append(createOption(item, index++, query))
      fragment.append(container)
    }

    list.replaceChildren(fragment)
    list.hidden = false
    status.hidden = true

    if (header) {
      header.replaceChildren()
      options.renderHeader?.(header, context)
      header.hidden = false
    }
    if (footer) {
      footer.replaceChildren()
      options.renderFooter?.(footer, context)
      footer.hidden = false
    }

    input.setAttribute('aria-expanded', 'true')
    showPopup()
  }

  const normalizeSuggestion = (
    suggestion: T,
    index: number,
    section: string | null
  ): NormalizedSuggestion<T> => {
    const rawId = String(getId(suggestion, index))
    const scope = section === null ? '' : `${sanitizeId(section)}-`
    return {
      id: `${instanceId}-option-${scope}${sanitizeId(rawId)}`,
      rawId,
      label: String(getLabel(suggestion)),
      value: String(getValue(suggestion)),
      section,
      data: suggestion,
    }
  }

  const showResults = (
    query: string,
    outcomes: readonly SectionOutcome<T>[],
    cached: boolean
  ): void => {
    if (destroyed) return

    const groups = outcomes.map(({ section, result }) => ({
      id: section.id,
      label: section.label,
      items: result
        .slice(0, section.maxResults)
        .map((suggestion, index) => normalizeSuggestion(suggestion, index, section.id)),
    }))
    const results: AutocompleteSectionResult<T>[] = groups.map(group => ({
      id: group.id ?? 'default',
      ...(group.label === undefined ? {} : { label: group.label }),
      suggestions: group.items.map(item => item.data),
    }))

    suggestions = groups.flatMap(group => group.items)
    activeIndex = -1

    if (suggestions.length === 0) renderStatus('empty', query)
    else {
      renderList(query, groups, { query, count: suggestions.length, sections: results })
      announce(resolveMessage(messages.results, { query, count: suggestions.length }))
    }

    dispatch('autocomplete:load', {
      query,
      suggestions: suggestions.map(suggestion => suggestion.data),
      sections: results,
      cached,
    })
  }

  const showRecent = (): boolean => {
    const items = recent?.get() ?? []
    if (destroyed || items.length === 0) return false

    cancel()
    const group = {
      id: RECENT_SECTION,
      label: recentLabel,
      items: items.map((item, index) => normalizeSuggestion(item, index, RECENT_SECTION)),
    }
    suggestions = group.items
    activeIndex = -1
    renderList('', [group], {
      query: '',
      count: suggestions.length,
      sections: [{ id: RECENT_SECTION, label: recentLabel, suggestions: items }],
    })
    announce(resolveMessage(messages.results, { query: '', count: suggestions.length }))
    return true
  }

  const filterLocal = (section: RuntimeSection<T>, items: readonly T[], query: string): T[] => {
    const filter = section.filter
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

    // Local arrays and cache hits resolve synchronously; only the rest wait.
    const outcomes = new Map<RuntimeSection<T>, readonly T[]>()
    const pending: RuntimeSection<T>[] = []
    let hits = 0

    for (const section of sections) {
      if (section.local) {
        outcomes.set(section, filterLocal(section, section.local, query))
        continue
      }
      const hit = section.cache?.get(query)
      if (hit) {
        hits += 1
        outcomes.set(section, hit)
      } else pending.push(section)
    }

    const ordered = (): SectionOutcome<T>[] =>
      sections
        .filter(section => outcomes.has(section))
        .map(section => ({ section, result: outcomes.get(section)! }))

    if (pending.length === 0) {
      showResults(query, ordered(), hits > 0)
      return
    }

    const controller = new AbortController()
    abortController = controller
    renderStatus('loading', query)
    dispatch('autocomplete:loadstart', { query })

    const settled = await Promise.allSettled(
      pending.map(async section => {
        const result = await section.source!(query, { signal: controller.signal, input })
        if (!Array.isArray(result)) {
          throw new TypeError('Autocomplete source must return an array.')
        }
        return result as readonly T[]
      })
    )

    if (sequence !== requestSequence || destroyed) return
    abortController = null

    const failures: { section: RuntimeSection<T>; error: unknown }[] = []
    settled.forEach((outcome, index) => {
      const section = pending[index]!
      if (outcome.status === 'fulfilled') {
        section.cache?.set(query, outcome.value)
        outcomes.set(section, outcome.value)
      } else if (!isAbortError(outcome.reason)) {
        failures.push({ section, error: outcome.reason })
      }
    })

    const hasResults = [...outcomes.values()].some(result => result.length > 0)
    if (failures.length > 0 && failures.length === pending.length && !hasResults) {
      suggestions = []
      activeIndex = -1
      renderStatus('error', query, failures[0]!.error)
    } else {
      showResults(query, ordered(), false)
    }

    for (const { section, error } of failures) {
      dispatch('autocomplete:error', { query, error, section: section.id })
      options.onError?.(error, input)
    }
  }

  const scheduleSearch = (): void => {
    clearTimeout(debounceTimer)
    const query = input.value.trim()

    if (selected !== null) {
      selected = null
      syncHidden('')
      dispatch('autocomplete:clear', { query })
    }

    if (query.length < minLength) {
      dismiss()
      if (query === '' && document.activeElement === input) showRecent()
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
    syncHidden('')
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
    const query = input.value.trim()
    if (query === '' && showRecent()) return
    if (searchOnFocus && query.length >= minLength) scheduleSearch()
  }

  const handleKeydown = (event: KeyboardEvent): void => {
    const listOpen = !list.hidden && suggestions.length > 0

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!listOpen) {
        // ArrowDown on an empty input opens the recent selections.
        if (event.key === 'ArrowDown' && input.value.trim() === '' && showRecent()) {
          event.preventDefault()
        }
        return
      }
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
    positioner.destroy()
    popup.remove()
    live.remove()
    if (hidden && !providedHidden) hidden.remove()
    for (const section of sections) section.cache?.clear()

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
    hiddenElement: hidden,
    recent,
    options,
    search,
    close: dismiss,
    clear,
    cancel,
    clearCache: () => sections.forEach(section => section.cache?.clear()),
    getSelected: () => selected,
    destroy,
  }
}

export const createAutocomplete = autocomplete
