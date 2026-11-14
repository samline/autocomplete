import type { AutocompleteHighlightPart } from './types'

export type AutocompleteNormalizer = (value: string) => string

export interface FilterSuggestionsOptions<T> {
  getText: (suggestion: T) => string
  normalize?: AutocompleteNormalizer
}

const COMBINING_MARKS = /\p{M}/gu
const WHITESPACE = /\s+/

/** Lowercases and removes diacritics, so `Cañón` and `canon` compare equal. */
export const normalizeText: AutocompleteNormalizer = value =>
  value.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase()

const getTerms = (query: string, normalize: AutocompleteNormalizer): string[] =>
  Array.from(new Set(normalize(query).split(WHITESPACE).filter(Boolean)))

/** Keeps the suggestions whose text contains every word of the query. */
export const filterSuggestions = <T>(
  suggestions: readonly T[],
  query: string,
  { getText, normalize = normalizeText }: FilterSuggestionsOptions<T>
): T[] => {
  const terms = getTerms(query, normalize)
  if (terms.length === 0) return [...suggestions]

  return suggestions.filter(suggestion => {
    const text = normalize(getText(suggestion))
    return terms.every(term => text.includes(term))
  })
}

/**
 * Splits `text` into parts that match a word of `query` and parts that do
 * not. Matching runs on normalized text but the parts keep the original
 * characters, accents included.
 */
export const highlight = (
  text: string,
  query: string,
  normalize: AutocompleteNormalizer = normalizeText
): AutocompleteHighlightPart[] => {
  const terms = getTerms(query, normalize)
  if (terms.length === 0 || text === '') return text === '' ? [] : [{ text, match: false }]

  // Map every normalized code unit back to the original character it came from.
  let normalized = ''
  const starts: number[] = []
  const ends: number[] = []
  let offset = 0

  for (const char of text) {
    const piece = normalize(char)
    // A character removed by normalization (a combining accent) belongs to
    // the character before it, so a match keeps its accent.
    if (piece === '' && ends.length > 0) ends[ends.length - 1] = offset + char.length
    normalized += piece
    for (let index = 0; index < piece.length; index += 1) {
      starts.push(offset)
      ends.push(offset + char.length)
    }
    offset += char.length
  }

  const ranges: [number, number][] = []
  for (const term of terms) {
    let found = normalized.indexOf(term)
    while (found !== -1) {
      ranges.push([starts[found]!, ends[found + term.length - 1]!])
      found = normalized.indexOf(term, found + 1)
    }
  }

  if (ranges.length === 0) return [{ text, match: false }]

  ranges.sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const range of ranges) {
    const last = merged[merged.length - 1]
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1])
    else merged.push([range[0], range[1]])
  }

  const parts: AutocompleteHighlightPart[] = []
  let cursor = 0
  for (const [start, end] of merged) {
    if (start > cursor) parts.push({ text: text.slice(cursor, start), match: false })
    parts.push({ text: text.slice(start, end), match: true })
    cursor = end
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), match: false })

  return parts
}
