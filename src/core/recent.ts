import { DEFAULT_RECENT_MAX } from '../constants'
import type { AutocompleteRecentStore } from './types'

export interface AutocompleteStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

export interface CreateRecentStoreOptions<T> {
  /** Storage key. Without one the store lives in memory only. */
  key?: string
  /** Items kept, most recent first. Defaults to 5. */
  max?: number
  /** Identity used to drop duplicates. Defaults to JSON equality. */
  getKey?: (suggestion: T) => string
  /** Defaults to `localStorage` when it is available. */
  storage?: AutocompleteStorage | null
}

const defaultStorage = (): AutocompleteStorage | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    // Accessing localStorage throws when site data is blocked.
    return null
  }
}

/**
 * A most-recent-first list of selections. Items are stored as JSON, so keep
 * suggestions serializable. Storage failures fall back to memory silently.
 */
export const createRecentStore = <T>({
  key,
  max = DEFAULT_RECENT_MAX,
  getKey = suggestion => JSON.stringify(suggestion),
  storage = defaultStorage(),
}: CreateRecentStoreOptions<T> = {}): AutocompleteRecentStore<T> => {
  let memory: T[] = []

  const read = (): T[] => {
    if (!key || !storage) return memory
    try {
      const parsed: unknown = JSON.parse(storage.getItem(key) ?? '[]')
      return Array.isArray(parsed) ? (parsed as T[]) : []
    } catch {
      return memory
    }
  }

  const write = (items: T[]): void => {
    memory = items
    if (!key || !storage) return
    try {
      if (items.length === 0) storage.removeItem(key)
      else storage.setItem(key, JSON.stringify(items))
    } catch {
      // Quota or privacy errors keep the in-memory copy.
    }
  }

  const without = (items: T[], suggestion: T): T[] => {
    const identity = getKey(suggestion)
    return items.filter(item => getKey(item) !== identity)
  }

  return {
    get: () => read().slice(0, max),
    add: suggestion => write([suggestion, ...without(read(), suggestion)].slice(0, max)),
    remove: suggestion => write(without(read(), suggestion)),
    clear: () => write([]),
  }
}
