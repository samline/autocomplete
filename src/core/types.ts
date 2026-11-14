export type AutocompleteTarget = string | HTMLInputElement

export type AutocompleteEndpoint =
  string | URL | ((query: string, input: HTMLInputElement) => string | URL)

export type AutocompleteRequestInit =
  RequestInit | ((query: string, input: HTMLInputElement) => RequestInit)

export type AutocompleteParser = (response: Response, query: string) => Promise<unknown>

export type AutocompleteResponseMapper<T> = (
  payload: unknown,
  response: Response,
  query: string
) => readonly T[] | Promise<readonly T[]>

export interface AutocompleteSourceContext {
  /** Aborted when a newer search starts, the list is dismissed or the instance is destroyed. */
  readonly signal: AbortSignal
  readonly input: HTMLInputElement
}

export type AutocompleteSourceFunction<T> = (
  query: string,
  context: AutocompleteSourceContext
) => readonly T[] | Promise<readonly T[]>

/** Static suggestions filtered in the browser, or a function that resolves them. */
export type AutocompleteSource<T> = readonly T[] | AutocompleteSourceFunction<T>

export interface AutocompleteEndpointOptions<T> {
  endpoint: AutocompleteEndpoint
  /** Query string parameter; `null` leaves the URL untouched. Defaults to `q`. */
  queryParam?: string | null
  requestInit?: AutocompleteRequestInit
  parseResponse?: AutocompleteParser
  mapResponse?: AutocompleteResponseMapper<T>
}

export interface AutocompleteCacheOptions {
  /** Cached queries kept; the least recently used is evicted. Defaults to 50. */
  max?: number
  /** Milliseconds a cached query stays fresh. Defaults to 300000. */
  ttl?: number
}

export interface AutocompleteMessageContext {
  query: string
  count: number
}

export type AutocompleteMessage = string | ((context: AutocompleteMessageContext) => string)

export interface AutocompleteMessages {
  loading: AutocompleteMessage
  empty: AutocompleteMessage
  error: AutocompleteMessage
  /** Announced to screen readers when suggestions load. */
  results: AutocompleteMessage
}

export interface AutocompleteHighlightPart {
  text: string
  match: boolean
}

export interface AutocompleteRenderContext {
  query: string
  index: number
  label: string
  /** The label split into matching and non-matching parts. */
  highlight: readonly AutocompleteHighlightPart[]
}

export interface AutocompleteSection<T = unknown> {
  /** Unique id, used in events and on `[data-autocomplete-group]`. */
  id: string
  /** Visible group heading; the group is unlabelled without it. */
  label?: string
  source: AutocompleteSource<T>
  /** Overrides the instance `maxResults` for this section. */
  maxResults?: number
  /** Local filter for an array source. */
  filter?: (suggestion: T, query: string) => boolean
  /** Overrides the instance `cache` for this section. */
  cache?: boolean | AutocompleteCacheOptions
}

export interface AutocompleteSectionResult<T = unknown> {
  id: string
  label?: string
  suggestions: readonly T[]
}

export interface AutocompleteRecentStore<T = unknown> {
  /** Most recent first. */
  get: () => T[]
  add: (suggestion: T) => void
  remove: (suggestion: T) => void
  clear: () => void
}

export interface AutocompleteRecentOptions<T = unknown> {
  /** Defaults to a localStorage store keyed by the input id, or memory without an id. */
  store?: AutocompleteRecentStore<T>
  /** Items kept by the default store. Defaults to 5. */
  max?: number
  /** Group heading. Defaults to `Recent searches`. */
  label?: string
}

export interface AutocompleteHiddenInputOptions<T = unknown> {
  /** Name of the hidden input created after the visible one. */
  name?: string
  /** An existing input to fill instead of creating one. */
  element?: HTMLInputElement | string
  /** Value stored on selection. Defaults to the suggestion id. */
  getValue?: (suggestion: T) => string
}

export type AutocompletePlacement = 'auto' | 'bottom' | 'top'

export type AutocompleteStatusState = 'loading' | 'empty' | 'error'

export interface AutocompleteStatusContext {
  state: AutocompleteStatusState
  query: string
  /** Present for the `error` state. */
  error?: unknown
}

export interface AutocompleteResultsContext<T = unknown> {
  query: string
  count: number
  sections: readonly AutocompleteSectionResult<T>[]
}

export interface AutocompleteOptions<T = unknown> {
  /** Suggestions as an array or a function. Use one of `source`, `endpoint` or `sections`. */
  source?: AutocompleteSource<T>
  endpoint?: AutocompleteEndpoint
  queryParam?: string | null
  requestInit?: AutocompleteRequestInit
  parseResponse?: AutocompleteParser
  mapResponse?: AutocompleteResponseMapper<T>
  /** Several labelled groups, searched in parallel and rendered in order. */
  sections?: readonly AutocompleteSection<T>[]
  /** Show recent selections while the input is empty. */
  recent?: boolean | AutocompleteRecentOptions<T>
  /** Keep a hidden form field in sync with the selection; a string is its name. */
  hiddenInput?: string | AutocompleteHiddenInputOptions<T>
  /** Where the popup opens; `auto` flips above when there is no room below. Defaults to `auto`. */
  placement?: AutocompletePlacement
  /** Render in the top layer with the Popover API, escaping `overflow: hidden`. Defaults to `false`. */
  popover?: boolean
  /** Gap in CSS pixels between the input and a popover popup. Defaults to 4. */
  offset?: number
  /** Customize the visible loading, empty and error message. */
  renderStatus?: (element: HTMLElement, context: AutocompleteStatusContext) => void
  /** Content above the listbox while results are shown. */
  renderHeader?: (element: HTMLElement, context: AutocompleteResultsContext<T>) => void
  /** Content below the listbox while results are shown. */
  renderFooter?: (element: HTMLElement, context: AutocompleteResultsContext<T>) => void
  /** Local filter for array sources. Defaults to an accent- and case-insensitive label match. */
  filter?: (suggestion: T, query: string) => boolean
  /** Text normalization used by the default filter and highlighting. */
  normalize?: (value: string) => string
  /** Remember results per query. Defaults to `true` for function and endpoint sources. */
  cache?: boolean | AutocompleteCacheOptions
  /** Wrap the matching parts of each label in `<mark>`. Defaults to `true`. */
  highlight?: boolean
  getId?: (suggestion: T, index: number) => string | number
  getLabel?: (suggestion: T) => string
  getValue?: (suggestion: T) => string
  renderOption?: (element: HTMLElement, suggestion: T, context: AutocompleteRenderContext) => void
  minLength?: number
  debounce?: number
  maxResults?: number
  searchOnFocus?: boolean
  messages?: Partial<AutocompleteMessages>
  onSelect?: (suggestion: T, input: HTMLInputElement) => void
  onError?: (error: unknown, input: HTMLInputElement) => void
}

export interface AutocompleteController<T = unknown> {
  readonly element: HTMLInputElement
  /** Positioned container holding the listbox and the visible status. */
  readonly popupElement: HTMLDivElement
  readonly listElement: HTMLDivElement
  readonly statusElement: HTMLDivElement
  /** Visually hidden polite live region. */
  readonly liveElement: HTMLDivElement
  /** The synced hidden input, when `hiddenInput` is set. */
  readonly hiddenElement: HTMLInputElement | null
  /** The recent selections store, when `recent` is set. */
  readonly recent: AutocompleteRecentStore<T> | null
  readonly options: Readonly<AutocompleteOptions<T>>
  search: (query?: string) => Promise<void>
  close: () => void
  clear: () => void
  cancel: () => void
  clearCache: () => void
  getSelected: () => T | null
  destroy: () => void
}

export interface AutocompleteSelectDetail<T = unknown> {
  suggestion: T
  label: string
  value: string
  /** The section id, or `null` for a single source. */
  section: string | null
}

export interface AutocompleteLoadDetail<T = unknown> {
  query: string
  suggestions: readonly T[]
  /** Results per section, in order; one unlabelled entry for a single source. */
  sections: readonly AutocompleteSectionResult<T>[]
  /** True when results came from the cache and no source was called. */
  cached: boolean
}

export interface AutocompleteErrorDetail {
  query: string
  error: unknown
  /** The failed section id, or `null` for a single source. */
  section: string | null
}

export interface AutocompleteCache<T> {
  get: (key: string) => readonly T[] | undefined
  set: (key: string, value: readonly T[]) => void
  clear: () => void
  readonly size: number
}
