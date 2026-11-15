import { afterEach, describe, expect, it, vi } from 'vitest'

import { createCache, createRecentStore, fromEndpoint, mapCommonResponse } from '../src/core'
import {
  getDefaultId,
  getDefaultLabel,
  getDefaultValue,
  resolveMessage,
  validateOptions,
} from '../src/core/state'
import { getMounted, mount, refresh, unmount } from '../src/browser/mount'

afterEach(() => {
  unmount()
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('sources', () => {
  it('maps common payloads and rejects everything else', () => {
    expect(mapCommonResponse([1], {} as Response, '')).toEqual([1])
    expect(mapCommonResponse({ suggestions: [2] }, {} as Response, '')).toEqual([2])
    expect(mapCommonResponse({ items: [3] }, {} as Response, '')).toEqual([3])
    expect(mapCommonResponse({ data: [4] }, {} as Response, '')).toEqual([4])
    for (const payload of [null, 'text', { other: [] }]) {
      expect(() => mapCommonResponse(payload, {} as Response, '')).toThrow(TypeError)
    }
  })

  it('fetches from static and dynamic endpoints and reports failures', async () => {
    expect(() => fromEndpoint({ endpoint: '' })).toThrow('requires an endpoint')
    const fetch = vi.fn(async (url: URL) =>
      url.searchParams.get('q') === 'bad'
        ? new Response('no', { status: 500 })
        : new Response(JSON.stringify({ items: [url.toString()] }))
    )
    vi.stubGlobal('fetch', fetch)
    const input = document.createElement('input')
    const signal = new AbortController().signal
    const fixed = fromEndpoint<string>({ endpoint: '/search' })
    expect(await fixed('one', { signal, input } as never)).toHaveLength(1)
    await expect(fixed('bad', { signal, input } as never)).rejects.toThrow('HTTP 500')

    const dynamic = fromEndpoint<string>({
      endpoint: query => `/dynamic/${query}`,
      queryParam: null,
      requestInit: () => ({ headers: { 'x-test': '1' } }),
      mapResponse: () => 'nope' as never,
    })
    await expect(dynamic('two', { signal, input } as never)).rejects.toThrow('must return an array')
  })
})

describe('state helpers', () => {
  it('reads labels, values and ids from every suggestion shape', () => {
    expect(getDefaultLabel('plain')).toBe('plain')
    expect(getDefaultLabel(null)).toBe('')
    expect(getDefaultLabel(7)).toBe('7')
    expect(getDefaultLabel({ name: 'N' })).toBe('N')
    expect(getDefaultLabel({})).toBe('')
    expect(getDefaultValue({ title: 'T' })).toBe('T')
    expect(getDefaultId('x', 3)).toBe(3)
    expect(getDefaultId({ id: 'a' }, 3)).toBe('a')
    expect(getDefaultId({}, 4)).toBe(4)
    expect(resolveMessage(({ count }) => `${count}`, { count: 2 } as never)).toBe('2')
  })

  it('rejects every invalid option', () => {
    const source = ['a']
    const invalid: unknown[] = [
      {},
      { source, endpoint: '/x' },
      { endpoint: '' },
      { source: 'nope' },
      { sections: [] },
      { sections: [{ id: 'bad id', source }] },
      {
        sections: [
          { id: 'a', source },
          { id: 'a', source },
        ],
      },
      { sections: [{ id: 'recent', source }], recent: true },
      { sections: [{ id: 'a', source, maxResults: 0 }] },
      { sections: [{ id: 'a', source, cache: { max: 0 } }] },
      { source, plugins: 'x' },
      { source, plugins: [{ name: 'p' }] },
      { source, minLength: -1 },
      { source, debounce: 1.5 },
      { source, maxResults: 0 },
      { source, cache: { ttl: -1 } },
      { source, recent: { max: 0 } },
      { source, placement: 'left' },
      { source, hiddenInput: {} },
    ]
    for (const options of invalid)
      expect(() => validateOptions(options as never)).toThrow(TypeError)
    expect(() =>
      validateOptions({
        sections: [{ id: 'a', source, cache: { max: 2, ttl: 0 } }],
        plugins: [{ name: 'p', setup: () => {} }],
        cache: true,
        recent: { max: 3 },
        placement: 'top',
        hiddenInput: { name: 'id' },
      } as never)
    ).not.toThrow()
  })
})

describe('cache and recent store', () => {
  it('expires and evicts the least recently used entries', () => {
    let time = 0
    const cache = createCache<number>({ max: 2, ttl: 10 }, () => time)
    cache.set('a', [1])
    cache.set('b', [2])
    expect(cache.get('a')).toEqual([1])
    cache.set('c', [3])
    expect(cache.get('b')).toBeUndefined()
    time = 20
    expect(cache.get('a')).toBeUndefined()
    expect(cache.size).toBe(1)
    cache.clear()
    expect(cache.size).toBe(0)
  })

  it('keeps recent items in storage, tolerates broken storage and falls back to memory', () => {
    const data = new Map<string, string>()
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, value),
      removeItem: (key: string) => void data.delete(key),
    }
    const store = createRecentStore<string>({ key: 'r', max: 2, storage })
    store.add('a')
    store.add('b')
    store.add('a')
    expect(store.get()).toEqual(['a', 'b'])
    store.remove('a')
    store.clear()
    expect(data.has('r')).toBe(false)
    data.set('r', '{"not":"array"}')
    expect(store.get()).toEqual([])
    data.set('r', '{broken')
    expect(store.get()).toEqual([])

    const failing = createRecentStore<string>({
      key: 'f',
      storage: {
        getItem: () => '[]',
        setItem: () => {
          throw new Error('quota')
        },
        removeItem: () => {},
      },
    })
    expect(() => failing.add('x')).not.toThrow()

    vi.stubGlobal('localStorage', undefined)
    const memory = createRecentStore<string>({ key: 'm' })
    memory.add('y')
    expect(memory.get()).toEqual(['y'])
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('blocked')
      },
    })
    expect(createRecentStore<string>().get()).toEqual([])
    vi.unstubAllGlobals()
  })
})

describe('declarative mount', () => {
  it('waits for DOMContentLoaded, enhances, re-scans, releases removed inputs and logs failures', async () => {
    const ready = vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading')
    document.body.innerHTML =
      '<input id="city" data-autocomplete data-autocomplete-source=\'["Lima"]\'>'
    mount()
    expect(getMounted().size).toBe(0)
    ready.mockReturnValue('complete')
    document.dispatchEvent(new Event('DOMContentLoaded'))
    expect(getMounted().size).toBe(1)
    mount()
    expect(getMounted().size).toBe(1)

    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    document.body.insertAdjacentHTML('beforeend', '<input data-autocomplete>')
    refresh()
    expect(error).toHaveBeenCalled()

    const holder = document.createElement('div')
    holder.innerHTML = '<input data-autocomplete data-autocomplete-source=\'["A"]\'>'
    document.body.append(holder)
    await Promise.resolve()
    expect(getMounted().size).toBe(2)
    holder.remove()
    document.body.append(document.createTextNode('text'))
    await Promise.resolve()
    expect(getMounted().size).toBe(1)
    unmount()
    expect(getMounted().size).toBe(0)
    refresh()
  })

  it('mounts without a MutationObserver', () => {
    vi.stubGlobal('MutationObserver', undefined)
    document.body.innerHTML = '<input data-autocomplete data-autocomplete-source=\'["A"]\'>'
    mount({ defaults: { minLength: 0 } })
    expect(getMounted().size).toBe(1)
  })
})
