import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AutocompleteApi } from '../../src/browser/registry'

// The IIFE build assigns these named exports to window.Autocomplete
// (scripts/test-package.mjs checks the built global itself).
async function importGlobal(): Promise<AutocompleteApi> {
  vi.resetModules()
  const module = (await import('../../src/browser/global')) as unknown as AutocompleteApi
  window.Autocomplete = { ...module }
  return window.Autocomplete
}

describe('browser global', () => {
  beforeEach(() => {
    document.body.innerHTML = '<input id="search">'
    delete (globalThis as { Autocomplete?: unknown }).Autocomplete
  })

  afterEach(() => {
    document.body.innerHTML = ''
    delete (globalThis as { Autocomplete?: unknown }).Autocomplete
  })

  it('exposes window.Autocomplete', async () => {
    const Autocomplete = await importGlobal()

    expect(window.Autocomplete).toBe(Autocomplete)
    expect(typeof Autocomplete.autocomplete).toBe('function')
    expect(typeof Autocomplete.create).toBe('function')
    expect(typeof Autocomplete.destroy).toBe('function')
  })

  it('registers and destroys instances by input id', async () => {
    const Autocomplete = await importGlobal()
    const controller = Autocomplete.create('#search', { endpoint: '/api/search' })

    expect(Autocomplete.available.search).toBe(controller)
    Autocomplete.destroy('search')
    expect(Autocomplete.available.search).toBeUndefined()
    expect(document.querySelector('[data-autocomplete-list]')).toBeNull()
  })

  it('requires an id for registry-backed instances', async () => {
    const Autocomplete = await importGlobal()
    const input = document.createElement('input')
    document.body.append(input)

    expect(() => Autocomplete.create(input, { endpoint: '/api/search' })).toThrow(
      'Autocomplete.create requires an input with an id.'
    )
  })
})
