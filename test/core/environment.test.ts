// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createRecentStore, fromEndpoint } from '../../src/core'

describe('core without a DOM', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('fetches an absolute endpoint without document', async () => {
    const fetchMock = vi.fn(async () => Response.json([{ label: 'Lima' }]))
    vi.stubGlobal('fetch', fetchMock)
    const source = fromEndpoint<{ label: string }>({ endpoint: 'https://example.com/cities' })

    await expect(source('li', { signal: new AbortController().signal } as never)).resolves.toEqual([
      { label: 'Lima' },
    ])
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toBe(
      'https://example.com/cities?q=li'
    )
  })

  it('reports a relative endpoint it cannot resolve', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const source = fromEndpoint({ endpoint: '/cities' })

    await expect(source('li', { signal: new AbortController().signal } as never)).rejects.toThrow(
      TypeError
    )
  })

  it('keeps recent items in memory without localStorage', () => {
    const store = createRecentStore<string>({ key: 'recent' })
    store.add('Lima')
    expect(store.get()).toEqual(['Lima'])
  })
})
