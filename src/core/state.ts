import type {
  AutocompleteMessage,
  AutocompleteMessageContext,
  AutocompleteMessages,
  AutocompleteOptions,
} from './types'

export const DEFAULT_MESSAGES: AutocompleteMessages = {
  loading: 'Searching...',
  empty: 'No results',
  error: 'Search failed',
  results: ({ count }) => (count === 1 ? '1 result available' : `${count} results available`),
}

export const resolveMessage = (
  message: AutocompleteMessage,
  context: AutocompleteMessageContext
): string => (typeof message === 'function' ? message(context) : message)

const readField = (suggestion: unknown, keys: readonly string[]): string => {
  if (typeof suggestion === 'string') return suggestion
  if (!suggestion || typeof suggestion !== 'object') return String(suggestion ?? '')

  const record = suggestion as Record<string, unknown>
  const key = keys.find(name => record[name] !== undefined && record[name] !== null)
  return key === undefined ? '' : String(record[key])
}

export const getDefaultLabel = (suggestion: unknown): string =>
  readField(suggestion, ['label', 'value', 'title', 'name'])

export const getDefaultValue = (suggestion: unknown): string =>
  readField(suggestion, ['value', 'label', 'title', 'name'])

export const getDefaultId = (suggestion: unknown, index: number): string | number => {
  if (!suggestion || typeof suggestion !== 'object') return index
  return ((suggestion as Record<string, unknown>).id as string | number | undefined) ?? index
}

const assertNonNegativeInteger = (value: number | undefined, name: string): void => {
  if (value !== undefined && (!Number.isInteger(value) || value < 0)) {
    throw new TypeError(`Autocomplete ${name} must be a non-negative integer.`)
  }
}

const assertPositiveInteger = (value: number | undefined, name: string): void => {
  if (value !== undefined && (!Number.isInteger(value) || value < 1)) {
    throw new TypeError(`Autocomplete ${name} must be an integer greater than zero.`)
  }
}

export const validateOptions = <T>(options: AutocompleteOptions<T>): void => {
  const hasSource = options.source !== undefined
  const hasEndpoint = options.endpoint !== undefined

  if (hasSource && hasEndpoint) {
    throw new TypeError('Autocomplete accepts either a source or an endpoint, not both.')
  }
  if (!hasSource && !options.endpoint) {
    throw new TypeError('Autocomplete requires a source or an endpoint.')
  }
  if (hasSource && !Array.isArray(options.source) && typeof options.source !== 'function') {
    throw new TypeError('Autocomplete source must be an array or a function.')
  }

  assertNonNegativeInteger(options.minLength, 'minLength')
  assertNonNegativeInteger(options.debounce, 'debounce')
  assertPositiveInteger(options.maxResults, 'maxResults')

  if (typeof options.cache === 'object') {
    assertPositiveInteger(options.cache.max, 'cache.max')
    assertNonNegativeInteger(options.cache.ttl, 'cache.ttl')
  }
}
