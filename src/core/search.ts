import { DEFAULT_MAX_RESULTS } from '../constants'
import { createCache } from './cache'
import { fromEndpoint } from './source'
import { getDefaultLabel, validateOptions } from './state'
import { filterSuggestions, normalizeText } from './text'
import type {
  AutocompleteCache,
  AutocompleteCacheOptions,
  AutocompleteEndpointOptions,
  AutocompleteSearch,
  AutocompleteSearchOptions,
  AutocompleteSearchResult,
  AutocompleteSectionResult,
  AutocompleteSourceContext,
  AutocompleteSourceFunction,
} from './types'

interface SearchSection<T> {
  /** `null` for a single source or endpoint. */
  id: string | null
  label: string | undefined
  local: readonly T[] | null
  source: AutocompleteSourceFunction<T> | null
  filter: ((suggestion: T, query: string) => boolean) | undefined
  maxResults: number
  cache: AutocompleteCache<T> | null
}

/** The id reported for the only section of a single source or endpoint. */
export const DEFAULT_SECTION_ID = 'default'

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError'

const resolveCache = <T>(
  setting: boolean | AutocompleteCacheOptions | undefined
): AutocompleteCache<T> | null =>
  setting === false ? null : createCache<T>(typeof setting === 'object' ? setting : {})

/**
 * The DOM-free search pipeline behind every autocomplete: sources, sections,
 * local filtering, caching, ordering and partial failures. `run()` returns
 * synchronously when every section is a local array or a cache hit, and a
 * promise otherwise. Use it to drive your own rendering.
 */
export const createSearch = <T = unknown>(
  options: AutocompleteSearchOptions<T>
): AutocompleteSearch<T> => {
  validateOptions(options)

  const getLabel = options.getLabel ?? (getDefaultLabel as (suggestion: T) => string)
  const normalize = options.normalize ?? normalizeText
  const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS

  const sections: SearchSection<T>[] = options.sections
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

  const filterLocal = (section: SearchSection<T>, items: readonly T[], query: string): T[] => {
    const filter = section.filter
    return filter
      ? items.filter(item => filter(item, query))
      : filterSuggestions(items, query, { getText: getLabel, normalize })
  }

  const finish = (
    query: string,
    outcomes: Map<SearchSection<T>, readonly T[]>,
    cached: boolean,
    errors: AutocompleteSearchResult<T>['errors'],
    pendingCount: number
  ): AutocompleteSearchResult<T> => {
    const results: AutocompleteSectionResult<T>[] = sections
      .filter(section => outcomes.has(section))
      .map(section => {
        const raw = outcomes.get(section)!
        const transformed = options.transformSuggestions
          ? options.transformSuggestions(raw, { query, section: section.id })
          : raw
        return {
          id: section.id ?? DEFAULT_SECTION_ID,
          ...(section.label === undefined ? {} : { label: section.label }),
          suggestions: transformed.slice(0, section.maxResults),
        }
      })
    const count = results.reduce((total, section) => total + section.suggestions.length, 0)

    return {
      query,
      sections: results,
      count,
      cached,
      errors,
      failed: errors.length > 0 && errors.length === pendingCount && count === 0,
    }
  }

  const run = (
    query: string,
    context: AutocompleteSourceContext
  ): AutocompleteSearchResult<T> | Promise<AutocompleteSearchResult<T>> => {
    const outcomes = new Map<SearchSection<T>, readonly T[]>()
    const pending: SearchSection<T>[] = []
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

    if (pending.length === 0) return finish(query, outcomes, hits > 0, [], 0)

    return Promise.allSettled(
      pending.map(async section => {
        const result = await section.source!(query, context)
        if (!Array.isArray(result)) {
          throw new TypeError('Autocomplete source must return an array.')
        }
        return result as readonly T[]
      })
    ).then(settled => {
      const errors: { section: string | null; error: unknown }[] = []
      let aborted = false

      settled.forEach((outcome, index) => {
        const section = pending[index]!
        if (outcome.status === 'fulfilled') {
          section.cache?.set(query, outcome.value)
          outcomes.set(section, outcome.value)
        } else if (isAbortError(outcome.reason) || context.signal.aborted) aborted = true
        else errors.push({ section: section.id, error: outcome.reason })
      })

      const result = finish(query, outcomes, false, errors, pending.length)
      return aborted ? { ...result, aborted: true } : result
    })
  }

  return {
    run,
    clearCache: () => sections.forEach(section => section.cache?.clear()),
    sections: sections.map(section => ({
      id: section.id,
      ...(section.label === undefined ? {} : { label: section.label }),
    })),
    local: sections.every(section => section.local !== null),
  }
}
