import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AutocompleteApi } from '../../src/browser/registry'

// The IIFE build assigns the registry to window.Autocomplete
// (scripts/test-package.mjs checks the built global itself).
const importGlobal = async (): Promise<AutocompleteApi> => {
  vi.resetModules()
  await import('../../src/browser/global')
  return window.Autocomplete
}

describe('browser global', () => {
  beforeEach(() => {
    document.body.innerHTML = '<input id="search"><input id="other">'
    delete (globalThis as { Autocomplete?: unknown }).Autocomplete
  })

  afterEach(() => {
    document.body.innerHTML = ''
    delete (globalThis as { Autocomplete?: unknown }).Autocomplete
  })

  it('exposes window.Autocomplete with the shared registry shape', async () => {
    const Autocomplete = await importGlobal()

    expect(Object.keys(Autocomplete).sort()).toEqual([
      'autocomplete',
      'available',
      'destroyAutocomplete',
      'destroyAutocompletes',
      'getAutocomplete',
      'getAutocompletes',
      'newAutocomplete',
    ])
  })

  it('registers, reads and destroys instances by input id', async () => {
    const Autocomplete = await importGlobal()
    const controller = Autocomplete.newAutocomplete({ id: 'search', options: { source: ['a'] } })

    expect(Autocomplete.getAutocomplete('search')).toBe(controller)
    expect(Autocomplete.available.search).toBe(controller)
    expect(Object.keys(Autocomplete.getAutocompletes())).toEqual(['search'])

    Autocomplete.destroyAutocomplete('search')
    expect(Autocomplete.getAutocomplete('search')).toBeNull()
    expect(document.querySelector('[data-autocomplete-list]')).toBeNull()
  })

  it('replaces an existing registration for the same id', async () => {
    const Autocomplete = await importGlobal()
    Autocomplete.newAutocomplete({ id: 'search', options: { source: ['a'] } })
    Autocomplete.newAutocomplete({ id: 'search', options: { source: ['b'] } })

    expect(document.querySelectorAll('[data-autocomplete-list]')).toHaveLength(1)
  })

  it('destroys by element, all at once, and on direct destroy()', async () => {
    const Autocomplete = await importGlobal()
    const search = Autocomplete.newAutocomplete({ id: 'search', options: { source: ['a'] } })!
    Autocomplete.newAutocomplete({ id: 'other', options: { source: ['a'] } })

    Autocomplete.destroyAutocomplete(search.element)
    expect(Autocomplete.getAutocomplete('search')).toBeNull()

    Autocomplete.destroyAutocompletes()
    expect(Autocomplete.getAutocompletes()).toEqual({})

    const again = Autocomplete.newAutocomplete({ id: 'search', options: { source: ['a'] } })!
    again.destroy()
    expect(Autocomplete.getAutocomplete('search')).toBeNull()
  })

  it('returns null for a missing id or input', async () => {
    const Autocomplete = await importGlobal()
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(Autocomplete.newAutocomplete({ id: '', options: { source: [] } })).toBeNull()
    expect(Autocomplete.newAutocomplete({ id: 'missing', options: { source: [] } })).toBeNull()
    expect(error).toHaveBeenCalledOnce()
    expect(warn).toHaveBeenCalledOnce()
  })
})
