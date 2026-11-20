import { DEFAULT_QUERY_PARAM } from '../constants'
import type {
  AutocompleteEndpointOptions,
  AutocompleteParser,
  AutocompleteResponseMapper,
  AutocompleteSourceFunction,
} from './types'

export const parseJsonResponse: AutocompleteParser = async response => response.json()

const invalidPayloadError = (): TypeError =>
  new TypeError(
    'Autocomplete response does not contain an array. Configure mapResponse(payload, response, query).'
  )

/** Accepts an array, or an object with a `suggestions`, `items` or `data` array. */
export const mapCommonResponse: AutocompleteResponseMapper<unknown> = payload => {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') throw invalidPayloadError()

  const record = payload as Record<string, unknown>
  if (Array.isArray(record.suggestions)) return record.suggestions
  if (Array.isArray(record.items)) return record.items
  if (Array.isArray(record.data)) return record.data

  throw invalidPayloadError()
}

/** Builds a source that fetches suggestions from an HTTP endpoint. */
export const fromEndpoint = <T>({
  endpoint,
  queryParam = DEFAULT_QUERY_PARAM,
  requestInit = {},
  parseResponse = parseJsonResponse,
  mapResponse = mapCommonResponse as AutocompleteResponseMapper<T>,
}: AutocompleteEndpointOptions<T>): AutocompleteSourceFunction<T> => {
  if (!endpoint) throw new TypeError('Autocomplete requires an endpoint.')

  return async (query, { signal, input }) => {
    const resolved = typeof endpoint === 'function' ? endpoint(query, input) : endpoint
    // Relative endpoints resolve against the page (or worker) URL; outside a
    // browser only absolute endpoints work, and URL reports the invalid one.
    const url = new URL(resolved, globalThis.document?.baseURI ?? globalThis.location?.href)
    if (queryParam !== null) url.searchParams.set(queryParam, query)

    const init = typeof requestInit === 'function' ? requestInit(query, input) : requestInit
    const response = await fetch(url, { ...init, signal })
    if (!response.ok) throw new Error(`Autocomplete request failed with HTTP ${response.status}.`)

    const payload = await parseResponse(response, query)
    const result = await mapResponse(payload, response, query)
    if (!Array.isArray(result))
      throw new TypeError('Autocomplete mapResponse must return an array.')

    return result
  }
}
