import { describe, expect, it } from 'vitest'

import { createCache } from '../../src'

describe('createCache', () => {
  it('evicts the least recently used entry', () => {
    const cache = createCache<number>({ max: 2 })
    cache.set('a', [1])
    cache.set('b', [2])
    cache.get('a')
    cache.set('c', [3])

    expect(cache.get('b')).toBeUndefined()
    expect(cache.get('a')).toEqual([1])
    expect(cache.get('c')).toEqual([3])
    expect(cache.size).toBe(2)
  })

  it('expires entries after the ttl', () => {
    let time = 0
    const cache = createCache<number>({ ttl: 100 }, () => time)
    cache.set('a', [1])

    time = 99
    expect(cache.get('a')).toEqual([1])
    time = 200
    expect(cache.get('a')).toBeUndefined()
    expect(cache.size).toBe(0)
  })

  it('clears every entry', () => {
    const cache = createCache<number>()
    cache.set('a', [1])
    cache.clear()
    expect(cache.size).toBe(0)
  })
})
