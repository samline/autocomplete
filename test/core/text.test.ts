import { describe, expect, it } from 'vitest'

import { filterSuggestions, highlight, normalizeText } from '../../src'

describe('normalizeText', () => {
  it('removes diacritics and lowercases', () => {
    expect(normalizeText('Cañón ÁRBOL Ümlaut')).toBe('canon arbol umlaut')
  })
})

describe('filterSuggestions', () => {
  const cities = ['San José', 'San Luis Potosí', 'Santa Fe', 'Mérida']
  const getText = (city: string) => city

  it('matches every word of the query in any order', () => {
    expect(filterSuggestions(cities, 'potosi san', { getText })).toEqual(['San Luis Potosí'])
    expect(filterSuggestions(cities, 'san', { getText })).toHaveLength(3)
  })

  it('returns a copy of every suggestion for an empty query', () => {
    const result = filterSuggestions(cities, '  ', { getText })
    expect(result).toEqual(cities)
    expect(result).not.toBe(cities)
  })

  it('accepts a custom normalizer', () => {
    expect(filterSuggestions(cities, 'MÉ', { getText, normalize: value => value })).toEqual([])
  })
})

describe('highlight', () => {
  it('keeps original characters while matching normalized text', () => {
    expect(highlight('Mérida', 'mer')).toEqual([
      { text: 'Mér', match: true },
      { text: 'ida', match: false },
    ])
  })

  it('marks every occurrence of every word and merges overlaps', () => {
    expect(highlight('banana bar', 'an ana ba')).toEqual([
      { text: 'banana', match: true },
      { text: ' ', match: false },
      { text: 'ba', match: true },
      { text: 'r', match: false },
    ])
  })

  it('handles decomposed input and characters outside the BMP', () => {
    expect(highlight('José 🌮 taco', 'jose taco')).toEqual([
      { text: 'José', match: true },
      { text: ' 🌮 ', match: false },
      { text: 'taco', match: true },
    ])
  })

  it('returns the whole text unmatched for an empty or missing query', () => {
    expect(highlight('Mérida', '')).toEqual([{ text: 'Mérida', match: false }])
    expect(highlight('Mérida', 'xyz')).toEqual([{ text: 'Mérida', match: false }])
    expect(highlight('', 'a')).toEqual([])
  })
})
