import {
  DEFAULT_DEBOUNCE,
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
import { createRecentStore } from '../core/recent'
import { createSearch } from '../core/search'
import {
  DEFAULT_MESSAGES,
  getDefaultId,
  getDefaultLabel,
  getDefaultValue,
  resolveMessage,
  validateOptions,
} from '../core/state'
import { highlight, normalizeText } from '../core/text'
import type {
  AutocompleteController,
  AutocompleteEventMap,
  AutocompleteHighlightPart,
  AutocompleteHooks,
  AutocompleteMessages,
  AutocompleteOptions,
  AutocompletePluginHooks,
  AutocompleteRecentStore,
  AutocompleteResultsContext,
  AutocompleteSearchResult,
  AutocompleteSectionResult,
  AutocompleteState,
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

interface RenderGroup<T> {
  id: string | null
  label: string | undefined
  items: NormalizedSuggestion<T>[]
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

const isPromise = <V>(value: V | Promise<V>): value is Promise<V> =>
  typeof (value as Promise<V> | undefined)?.then === 'function'

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

  // Hooks run in order: the options first, then each plugin.
  const hooks: AutocompletePluginHooks<T>[] = [options]

  const engine = createSearch<T>({
    ...options,
    transformSuggestions: (suggestions, context) =>
      hooks.reduce<readonly T[]>(
        (current, hook) =>
          hook.transformSuggestions ? hook.transformSuggestions(current, context) : current,
        suggestions
      ),
  })
  const singleSource = options.sections === undefined
  const minLength = options.minLength ?? (engine.local ? 1 : DEFAULT_MIN_LENGTH)
  const debounce = options.debounce ?? (engine.local ? 0 : DEFAULT_DEBOUNCE)
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

  const listeners = new Set<(state: AutocompleteState<T>) => void>()
  let state: AutocompleteState<T> = {
    query: '',
    status: 'idle',
    open: false,
    suggestions: [],
    sections: [],
    activeIndex: -1,
    selected: null,
  }

  let suggestions: NormalizedSuggestion<T>[] = []
  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  let abortController: AbortController | null = null
  let requestSequence = 0
  let destroyed = false
  let suppressFocusSearch = false

  const setState = (patch: Partial<AutocompleteState<T>>): void => {
    const changed = (Object.keys(patch) as (keyof AutocompleteState<T>)[]).some(
      key => patch[key] !== state[key]
    )
    if (!changed) return
    state = { ...state, ...patch }
    listeners.forEach(listener => listener(state))
  }

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

  const dispatch = <K extends keyof AutocompleteEventMap<T>>(
    name: K,
    detail: AutocompleteEventMap<T>[K]
  ): void => {
    input.dispatchEvent(new CustomEvent(`autocomplete:${name}`, { bubbles: true, detail }))
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

  const updateActiveOption = (index: number): void => {
    const elements = list.querySelectorAll<HTMLElement>(`[${OPTION_ATTRIBUTE}]`)

    elements.forEach((element, position) => {
      const active = position === index
      element.dataset.active = String(active)
      element.setAttribute('aria-selected', String(active))
    })

    const active = elements.item(index)
    if (active) {
      input.setAttribute('aria-activedescendant', active.id)
      active.scrollIntoView({ block: 'nearest' })
    } else input.removeAttribute('aria-activedescendant')

    setState({ activeIndex: active ? index : -1 })
  }

  const showPopup = (): void => {
    const wasOpen = state.open
    popup.hidden = false
    positioner.open()
    setState({ open: true })
    if (!wasOpen) dispatch('open', { query: state.query })
  }

  const close = (): void => {
    const wasOpen = state.open
    popup.hidden = true
    list.hidden = true
    status.hidden = true
    if (header) header.hidden = true
    if (footer) footer.hidden = true
    positioner.close()
    input.setAttribute('aria-expanded', 'false')
    updateActiveOption(-1)
    setState({ open: false })
    if (wasOpen) dispatch('close', { query: state.query })
  }

  // Closing is a user decision: drop the pending search and abort the request
  // in flight, otherwise its response would reopen the list.
  const dismiss = (): void => {
    cancel()
    if (state.status === 'loading') setState({ status: 'idle' })
    close()
  }

  const renderStatus = (kind: AutocompleteStatusState, query: string, error?: unknown): void => {
    if (destroyed) return

    const message = resolveMessage(messages[kind], { query, count: 0 })
    suggestions = []
    list.replaceChildren()
    list.hidden = true
    if (header) header.hidden = true
    if (footer) footer.hidden = true
    status.textContent = message
    status.setAttribute(STATUS_ATTRIBUTE, kind)
    options.renderStatus?.(status, { state: kind, query, ...(kind === 'error' ? { error } : {}) })
    status.hidden = false
    input.setAttribute('aria-expanded', 'false')
    updateActiveOption(-1)
    setState({ query, status: kind, suggestions: [], sections: [] })
    showPopup()
    if (kind !== 'loading') announce(message)
  }

  const applySelection = (suggestion: NormalizedSuggestion<T> | null): void => {
    input.value = suggestion?.value ?? ''
    syncHidden(
      suggestion ? (getHiddenValue ? getHiddenValue(suggestion.data) : suggestion.rawId) : ''
    )
    setState({ selected: suggestion?.data ?? null })
  }

  const select = (index: number): void => {
    const suggestion = suggestions[index]
    if (!suggestion) return
    if (hooks.some(hook => hook.beforeSelect?.(suggestion.data, input) === false)) return

    applySelection(suggestion)
    recent?.add(suggestion.data)
    dismiss()
    dispatch('select', {
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
    updateActiveOption(Number((event.currentTarget as HTMLElement).dataset.index))
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
    groups: readonly RenderGroup<T>[],
    context: AutocompleteResultsContext<T>,
    listStatus: 'results' | 'recent'
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

    suggestions = groups.flatMap(group => group.items)
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
    updateActiveOption(-1)
    setState({
      query,
      status: listStatus,
      suggestions: suggestions.map(suggestion => suggestion.data),
      sections: context.sections,
    })
    showPopup()
    announce(resolveMessage(messages.results, { query, count: suggestions.length }))
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

  const showResults = (result: AutocompleteSearchResult<T>): void => {
    if (destroyed) return
    const { query } = result

    if (result.failed) {
      renderStatus('error', query, result.errors[0]?.error)
    } else if (result.count === 0) {
      renderStatus('empty', query)
    } else {
      const groups = result.sections.map(section => {
        const id = singleSource ? null : section.id
        return {
          id,
          label: section.label,
          items: section.suggestions.map((suggestion, index) =>
            normalizeSuggestion(suggestion, index, id)
          ),
        }
      })
      renderList(
        query,
        groups,
        { query, count: result.count, sections: result.sections },
        'results'
      )
    }

    if (!result.failed) {
      dispatch('load', {
        query,
        suggestions: result.sections.flatMap(section => section.suggestions),
        sections: result.sections,
        cached: result.cached,
      })
    }

    for (const { section, error } of result.errors) {
      dispatch('error', { query, error, section })
      options.onError?.(error, input)
    }
  }

  const showRecent = (): boolean => {
    const items = recent?.get() ?? []
    if (destroyed || items.length === 0) return false

    cancel()
    const sections: AutocompleteSectionResult<T>[] = [
      { id: RECENT_SECTION, label: recentLabel, suggestions: items },
    ]
    renderList(
      '',
      [
        {
          id: RECENT_SECTION,
          label: recentLabel,
          items: items.map((item, index) => normalizeSuggestion(item, index, RECENT_SECTION)),
        },
      ],
      { query: '', count: items.length, sections },
      'recent'
    )
    return true
  }

  const resolveQuery = (query: string): string | false => {
    let current = query
    for (const hook of hooks as AutocompleteHooks<T>[]) {
      const next = hook.beforeSearch?.(current, input)
      if (next === false) return false
      if (typeof next === 'string') current = next
    }
    return current
  }

  const search = async (requested: string = input.value.trim()): Promise<void> => {
    if (destroyed || requested.length < minLength) {
      close()
      return
    }

    const query = resolveQuery(requested)
    if (query === false) {
      dismiss()
      return
    }

    cancel()
    const sequence = ++requestSequence
    const controller = new AbortController()
    const outcome = engine.run(query, { signal: controller.signal, input })

    if (!isPromise(outcome)) {
      showResults(outcome)
      return
    }

    abortController = controller
    renderStatus('loading', query)
    dispatch('loadstart', { query })

    const result = await outcome
    if (sequence !== requestSequence || destroyed || result.aborted) return
    abortController = null
    showResults(result)
  }

  const scheduleSearch = (): void => {
    clearTimeout(debounceTimer)
    const query = input.value.trim()

    if (state.selected !== null) {
      setState({ selected: null })
      syncHidden('')
      dispatch('clear', { query })
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
    const hadSelection = state.selected !== null
    cancel()
    suggestions = []
    applySelection(null)
    close()
    setState({ query: '', status: 'idle', suggestions: [], sections: [] })
    announce('')
    if (hadSelection) dispatch('clear', { query: '' })
  }

  const setValue = (suggestion: T | null): void => {
    applySelection(suggestion === null ? null : normalizeSuggestion(suggestion, 0, null))
  }

  const moveActiveOption = (direction: number): void => {
    if (list.hidden || suggestions.length === 0) return
    const current = state.activeIndex

    updateActiveOption(
      current === -1
        ? direction > 0
          ? 0
          : suggestions.length - 1
        : (current + direction + suggestions.length) % suggestions.length
    )
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

    if (event.key === 'Enter' && listOpen && state.activeIndex >= 0) {
      event.preventDefault()
      select(state.activeIndex)
      return
    }

    if ((event.key === 'Home' || event.key === 'End') && listOpen) {
      event.preventDefault()
      updateActiveOption(event.key === 'Home' ? 0 : suggestions.length - 1)
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

  const on = <K extends keyof AutocompleteEventMap<T>>(
    event: K,
    listener: (detail: AutocompleteEventMap<T>[K]) => void
  ): (() => void) => {
    const handler = (domEvent: Event): void =>
      listener((domEvent as CustomEvent<AutocompleteEventMap<T>[K]>).detail)
    input.addEventListener(`autocomplete:${event}`, handler)
    return () => input.removeEventListener(`autocomplete:${event}`, handler)
  }

  const subscribe = (listener: (state: AutocompleteState<T>) => void): (() => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
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
    engine.clearCache()

    originalAttributes.forEach((value, name) => restoreAttribute(input, name, value))
    if (label) restoreAttribute(label, 'id', originalLabelId)

    for (const hook of hooks) {
      if (hook !== options) (hook as AutocompletePluginHooks<T>).destroy?.()
    }
    listeners.clear()
  }

  input.addEventListener('input', handleInput)
  input.addEventListener('compositionend', scheduleSearch)
  input.addEventListener('focus', handleFocus)
  input.addEventListener('keydown', handleKeydown)
  document.addEventListener('pointerdown', handleDocumentPointerDown)

  const controller: AutocompleteController<T> = {
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
    clearCache: engine.clearCache,
    getSelected: () => state.selected,
    setValue,
    getState: () => state,
    subscribe,
    on,
    destroy,
  }

  for (const plugin of options.plugins ?? []) {
    const pluginHooks = plugin.setup(controller)
    if (pluginHooks) hooks.push(pluginHooks)
  }

  return controller
}

export const createAutocomplete = autocomplete
