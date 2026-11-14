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

export interface AutocompleteOptions<T = unknown> {
  /** Suggestions as an array or a function. Use either `source` or `endpoint`. */
  source?: AutocompleteSource<T>
  endpoint?: AutocompleteEndpoint
  queryParam?: string | null
  requestInit?: AutocompleteRequestInit
  parseResponse?: AutocompleteParser
  mapResponse?: AutocompleteResponseMapper<T>
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
}

export interface AutocompleteLoadDetail<T = unknown> {
  query: string
  suggestions: readonly T[]
  /** True when the results came from the cache without calling the source. */
  cached: boolean
}

export interface AutocompleteErrorDetail {
  query: string
  error: unknown
}

export interface AutocompleteCache<T> {
  get: (key: string) => readonly T[] | undefined
  set: (key: string, value: readonly T[]) => void
  clear: () => void
  readonly size: number
}
