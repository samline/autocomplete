import { DEFAULT_CACHE_SIZE, DEFAULT_CACHE_TTL } from '../constants'
import type { AutocompleteCache, AutocompleteCacheOptions } from './types'

interface CacheEntry<T> {
  value: readonly T[]
  expires: number
}

/** Least-recently-used cache of suggestions keyed by query. */
export const createCache = <T>(
  { max = DEFAULT_CACHE_SIZE, ttl = DEFAULT_CACHE_TTL }: AutocompleteCacheOptions = {},
  now: () => number = Date.now
): AutocompleteCache<T> => {
  const entries = new Map<string, CacheEntry<T>>()

  const get = (key: string): readonly T[] | undefined => {
    const entry = entries.get(key)
    if (!entry) return undefined

    entries.delete(key)
    if (entry.expires <= now()) return undefined

    // Re-insert so the entry becomes the most recently used.
    entries.set(key, entry)
    return entry.value
  }

  const set = (key: string, value: readonly T[]): void => {
    entries.delete(key)
    entries.set(key, { value, expires: now() + ttl })

    while (entries.size > max) {
      const oldest = entries.keys().next()
      if (oldest.done) break
      entries.delete(oldest.value)
    }
  }

  return {
    get,
    set,
    clear: () => entries.clear(),
    get size() {
      return entries.size
    },
  }
}
