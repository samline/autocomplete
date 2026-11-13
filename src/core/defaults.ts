import type {
  AutocompleteMessages,
  AutocompleteOptions,
  AutocompleteParser,
  AutocompleteResponseMapper,
} from './types'

export const DEFAULT_MESSAGES: AutocompleteMessages = {
  loading: 'Searching...',
  empty: 'No results',
  error: 'Search failed',
}

export const parseJsonResponse: AutocompleteParser = async response => response.json()

export const mapCommonResponse: AutocompleteResponseMapper<unknown> = payload => {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') throw invalidPayloadError()

  const record = payload as Record<string, unknown>
  if (Array.isArray(record.suggestions)) return record.suggestions
  if (Array.isArray(record.items)) return record.items
  if (Array.isArray(record.data)) return record.data

  throw invalidPayloadError()
}

export function getDefaultLabel(suggestion: unknown): string {
  if (typeof suggestion === 'string') return suggestion
  if (!suggestion || typeof suggestion !== 'object') return String(suggestion ?? '')

  const record = suggestion as Record<string, unknown>
  return String(record.label ?? record.value ?? record.title ?? '')
}

export function getDefaultValue(suggestion: unknown): string {
  if (typeof suggestion === 'string') return suggestion
  if (!suggestion || typeof suggestion !== 'object') return String(suggestion ?? '')

  const record = suggestion as Record<string, unknown>
  return String(record.value ?? record.label ?? record.title ?? '')
}

export function getDefaultId(suggestion: unknown, index: number): string | number {
  if (!suggestion || typeof suggestion !== 'object') return index
  return ((suggestion as Record<string, unknown>).id as string | number | undefined) ?? index
}

export function validateOptions<T>(options: AutocompleteOptions<T>): void {
  if (!options.endpoint) throw new TypeError('Autocomplete requires an endpoint.')
  assertNonNegativeInteger(options.minLength, 'minLength')
  assertNonNegativeInteger(options.debounce, 'debounce')

  if (
    options.maxResults !== undefined &&
    (!Number.isInteger(options.maxResults) || options.maxResults < 1)
  ) {
    throw new TypeError('Autocomplete maxResults must be an integer greater than zero.')
  }
}

function assertNonNegativeInteger(value: number | undefined, name: string): void {
  if (value !== undefined && (!Number.isInteger(value) || value < 0)) {
    throw new TypeError(`Autocomplete ${name} must be a non-negative integer.`)
  }
}

function invalidPayloadError(): TypeError {
  return new TypeError(
    'Autocomplete response does not contain an array. Configure mapResponse(payload, response, query).'
  )
}
