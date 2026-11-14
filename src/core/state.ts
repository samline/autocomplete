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

const SECTION_ID = /^[A-Za-z0-9_-]+$/

const assertSource = (source: unknown, name: string): void => {
  if (!Array.isArray(source) && typeof source !== 'function') {
    throw new TypeError(`Autocomplete ${name} must be an array or a function.`)
  }
}

const assertCache = (cache: AutocompleteOptions['cache'], name: string): void => {
  if (typeof cache !== 'object') return
  assertPositiveInteger(cache.max, `${name}.max`)
  assertNonNegativeInteger(cache.ttl, `${name}.ttl`)
}

export const validateOptions = <T>(options: AutocompleteOptions<T>): void => {
  const kinds = [options.source, options.endpoint, options.sections].filter(
    value => value !== undefined
  )

  if (kinds.length > 1) {
    throw new TypeError('Autocomplete accepts one of source, endpoint or sections.')
  }
  if (kinds.length === 0 || (options.endpoint !== undefined && !options.endpoint)) {
    throw new TypeError('Autocomplete requires a source, an endpoint or sections.')
  }
  if (options.source !== undefined) assertSource(options.source, 'source')

  if (options.sections !== undefined) {
    if (!Array.isArray(options.sections) || options.sections.length === 0) {
      throw new TypeError('Autocomplete sections must be a non-empty array.')
    }
    const ids = new Set<string>()
    for (const section of options.sections) {
      if (!section || !SECTION_ID.test(section.id ?? '')) {
        throw new TypeError('Autocomplete section ids must use letters, digits, - or _.')
      }
      if (ids.has(section.id)) {
        throw new TypeError(`Autocomplete section id "${section.id}" is repeated.`)
      }
      if (options.recent && section.id === 'recent') {
        throw new TypeError('Autocomplete section id "recent" is reserved when recent is enabled.')
      }
      ids.add(section.id)
      assertSource(section.source, `section "${section.id}" source`)
      assertPositiveInteger(section.maxResults, `section "${section.id}" maxResults`)
      assertCache(section.cache, `section "${section.id}" cache`)
    }
  }

  if (options.plugins !== undefined) {
    if (!Array.isArray(options.plugins)) {
      throw new TypeError('Autocomplete plugins must be an array.')
    }
    for (const plugin of options.plugins) {
      if (!plugin || typeof plugin.name !== 'string' || typeof plugin.setup !== 'function') {
        throw new TypeError('Autocomplete plugins need a name and a setup function.')
      }
    }
  }

  assertNonNegativeInteger(options.minLength, 'minLength')
  assertNonNegativeInteger(options.debounce, 'debounce')
  assertPositiveInteger(options.maxResults, 'maxResults')
  assertNonNegativeInteger(options.offset, 'offset')
  assertCache(options.cache, 'cache')

  if (typeof options.recent === 'object') assertPositiveInteger(options.recent.max, 'recent.max')
  if (options.placement !== undefined && !['auto', 'bottom', 'top'].includes(options.placement)) {
    throw new TypeError("Autocomplete placement must be 'auto', 'bottom' or 'top'.")
  }
  if (
    typeof options.hiddenInput === 'object' &&
    !options.hiddenInput.name &&
    !options.hiddenInput.element
  ) {
    throw new TypeError('Autocomplete hiddenInput needs a name or an element.')
  }
}
