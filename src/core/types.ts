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

export interface AutocompleteMessages {
  loading: string
  empty: string
  error: string
}

export interface AutocompleteOptions<T = unknown> {
  endpoint: AutocompleteEndpoint
  queryParam?: string | null
  requestInit?: AutocompleteRequestInit
  parseResponse?: AutocompleteParser
  mapResponse?: AutocompleteResponseMapper<T>
  getId?: (suggestion: T, index: number) => string | number
  getLabel?: (suggestion: T) => string
  getValue?: (suggestion: T) => string
  renderOption?: (element: HTMLButtonElement, suggestion: T) => void
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
  readonly listElement: HTMLDivElement
  readonly options: Readonly<AutocompleteOptions<T>>
  search(query?: string): Promise<void>
  close(): void
  clear(): void
  cancel(): void
  getSelected(): T | null
  destroy(): void
}

export interface AutocompleteSelectDetail<T = unknown> {
  suggestion: T
  label: string
  value: string
}

export interface AutocompleteLoadDetail<T = unknown> {
  query: string
  suggestions: readonly T[]
}

export interface AutocompleteErrorDetail {
  query: string
  error: unknown
}

export interface NormalizedSuggestion<T> {
  id: string
  label: string
  value: string
  data: T
}
