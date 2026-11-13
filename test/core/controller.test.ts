import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createAutocomplete } from '../../src'

interface Place {
  key: string
  description: string
}

const places: Place[] = [
  { key: 'mx', description: 'Mexico City' },
  { key: 'mor', description: 'Cuernavaca, Morelos' }
]

function inputMarkup(): void {
  document.body.innerHTML = '<label for="place">Place</label><input id="place" class="original">'
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  })
}

function options() {
  return {
    endpoint: '/api/places',
    debounce: 0,
    mapResponse: (payload: unknown) => (payload as { results: Place[] }).results,
    getId: (place: Place) => place.key,
    getLabel: (place: Place) => place.description,
    getValue: (place: Place) => place.description
  }
}

describe('createAutocomplete', () => {
  beforeEach(() => {
    inputMarkup()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn()
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('requires a valid input and endpoint', () => {
    expect(() => createAutocomplete('#missing', { endpoint: '/api' })).toThrow(TypeError)
    expect(() => createAutocomplete('#place', { endpoint: '' })).toThrow(
      'Autocomplete requires an endpoint.'
    )
  })

  it('configures an accessible combobox and listbox', () => {
    const controller = createAutocomplete('#place', options())

    expect(controller.element.getAttribute('role')).toBe('combobox')
    expect(controller.element.getAttribute('aria-autocomplete')).toBe('list')
    expect(controller.element.getAttribute('aria-controls')).toBe(controller.listElement.id)
    expect(controller.listElement.getAttribute('role')).toBe('listbox')
    expect(controller.listElement.hidden).toBe(true)
  })

  it('queries the configured endpoint and maps arbitrary payloads', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ results: places }))
    vi.stubGlobal('fetch', fetchMock)
    const controller = createAutocomplete('#place', {
      ...options(),
      queryParam: 'search',
      requestInit: { headers: { 'X-Client': 'test' } }
    })

    await controller.search('mex')

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit]
    expect(url.toString()).toBe('http://localhost/api/places?search=mex')
    expect(init.headers).toEqual({ 'X-Client': 'test' })
    expect(controller.listElement.textContent).toContain('Mexico City')
    expect(controller.element.getAttribute('aria-expanded')).toBe('true')
  })

  it('supports endpoint and requestInit resolver functions', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(places))
    vi.stubGlobal('fetch', fetchMock)
    const input = document.querySelector<HTMLInputElement>('#place')!
    const controller = createAutocomplete<Place>(input, {
      endpoint: (query, element) => `/lookup/${element.id}/${query}`,
      queryParam: null,
      requestInit: (query) => ({ headers: { 'X-Query': query } }),
      getLabel: (place) => place.description
    })

    await controller.search('city')

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit]
    expect(url.pathname).toBe('/lookup/place/city')
    expect(init.headers).toEqual({ 'X-Query': 'city' })
  })

  it('debounces input before searching', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ results: places }))
    vi.stubGlobal('fetch', fetchMock)
    const controller = createAutocomplete('#place', { ...options(), debounce: 200 })

    controller.element.value = 'me'
    controller.element.dispatchEvent(new Event('input'))
    await vi.advanceTimersByTimeAsync(199)
    expect(fetchMock).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('selects with arrow keys and Enter', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ results: places })))
    const onSelect = vi.fn()
    const controller = createAutocomplete('#place', { ...options(), onSelect })
    const selected = vi.fn()
    controller.element.addEventListener('autocomplete:select', selected)

    await controller.search('me')
    controller.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    controller.element.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', cancelable: true })
    )

    expect(controller.element.value).toBe('Mexico City')
    expect(controller.getSelected()).toEqual(places[0])
    expect(onSelect).toHaveBeenCalledWith(places[0], controller.element)
    expect(selected).toHaveBeenCalledOnce()
    expect(controller.listElement.hidden).toBe(true)
  })

  it('wraps keyboard navigation in both directions', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ results: places })))
    const controller = createAutocomplete('#place', options())
    await controller.search('place')

    controller.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    expect(controller.element.getAttribute('aria-activedescendant')).toContain('mor')
    controller.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(controller.element.getAttribute('aria-activedescendant')).toContain('mx')
  })

  it('selects with the pointer and preserves the original object', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ results: places })))
    const controller = createAutocomplete('#place', options())
    await controller.search('morelos')

    const second = controller.listElement.querySelectorAll<HTMLButtonElement>('[role="option"]')[1]!
    second.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }))

    expect(controller.getSelected()).toEqual(places[1])
    expect(controller.element.value).toBe('Cuernavaca, Morelos')
  })

  it('renders loading, empty, and error states', async () => {
    let response = jsonResponse({ results: [] })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => response)
    )
    const controller = createAutocomplete('#place', {
      ...options(),
      messages: { loading: 'Loading', empty: 'Nothing', error: 'Failed' }
    })

    const pending = controller.search('empty')
    expect(controller.listElement.textContent).toBe('Loading')
    await pending
    expect(controller.listElement.textContent).toBe('Nothing')

    response = jsonResponse({}, 500)
    await controller.search('error')
    expect(controller.listElement.textContent).toBe('Failed')
    expect(controller.listElement.querySelector('[role="alert"]')).toBeTruthy()
  })

  it('ignores stale responses and aborts the previous request', async () => {
    let resolveFirst: ((response: Response) => void) | undefined
    const first = new Promise<Response>((resolve) => {
      resolveFirst = resolve
    })
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(first)
      .mockResolvedValueOnce(jsonResponse({ results: [places[1]] }))
    vi.stubGlobal('fetch', fetchMock)
    const controller = createAutocomplete('#place', options())

    const oldSearch = controller.search('old')
    await controller.search('new')
    resolveFirst?.(jsonResponse({ results: [places[0]] }))
    await oldSearch

    expect(controller.listElement.textContent).toContain('Cuernavaca')
    expect(controller.listElement.textContent).not.toContain('Mexico City')
  })

  it('clears selection and emits autocomplete:clear when edited', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ results: places })))
    const controller = createAutocomplete('#place', options())
    const cleared = vi.fn()
    controller.element.addEventListener('autocomplete:clear', cleared)
    await controller.search('me')
    controller.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    controller.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))

    controller.element.value = 'changed'
    controller.element.dispatchEvent(new Event('input'))

    expect(controller.getSelected()).toBeNull()
    expect(cleared).toHaveBeenCalledOnce()
  })

  it('Escape, Tab and clicking outside cancel pending and in-flight searches', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ results: places }))
    vi.stubGlobal('fetch', fetchMock)
    const controller = createAutocomplete('#place', { ...options(), debounce: 100 })
    const type = (value: string) => {
      controller.element.value = value
      controller.element.dispatchEvent(new Event('input'))
    }

    for (const dismiss of [
      () => controller.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true })),
      () => controller.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' })),
      () => document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    ]) {
      type('mexico')
      dismiss()
      await vi.advanceTimersByTimeAsync(200)
      expect(controller.listElement.hidden).toBe(true)
    }
    expect(fetchMock).not.toHaveBeenCalled()

    // A request already in flight is aborted and cannot reopen the list.
    let resolve!: (response: Response) => void
    fetchMock.mockImplementationOnce(() => new Promise<Response>(r => (resolve = r)))
    const pending = controller.search('mexico')
    controller.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }))
    resolve(jsonResponse({ results: places }))
    await pending
    expect(controller.listElement.hidden).toBe(true)
  })

  it('a late response does not reopen the list after close()', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ results: places }))
    vi.stubGlobal('fetch', fetchMock)
    const controller = createAutocomplete('#place', options())
    await controller.search('me')

    let resolve!: (response: Response) => void
    fetchMock.mockImplementationOnce(() => new Promise<Response>(r => (resolve = r)))
    const late = controller.search('mex')
    controller.close()
    resolve(jsonResponse({ results: places }))
    await late
    expect(controller.listElement.hidden).toBe(true)
  })

  it('waits for IME composition to end before searching', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ results: places }))
    vi.stubGlobal('fetch', fetchMock)
    const controller = createAutocomplete('#place', options())

    controller.element.value = 'とう'
    controller.element.dispatchEvent(new InputEvent('input', { isComposing: true }))
    await vi.advanceTimersByTimeAsync(10)
    expect(fetchMock).not.toHaveBeenCalled()

    controller.element.value = '東京'
    controller.element.dispatchEvent(new CompositionEvent('compositionend', { data: '東京' }))
    await vi.advanceTimersByTimeAsync(10)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('moves to the first and last option with Home and End', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ results: places })))
    const controller = createAutocomplete('#place', options())
    await controller.search('place')

    controller.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', cancelable: true }))
    expect(controller.element.getAttribute('aria-activedescendant')).toContain('mor')
    controller.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', cancelable: true }))
    expect(controller.element.getAttribute('aria-activedescendant')).toContain('mx')

    controller.close()
    const home = new KeyboardEvent('keydown', { key: 'Home', cancelable: true })
    controller.element.dispatchEvent(home)
    // With the list closed, Home/End keep moving the text caret.
    expect(home.defaultPrevented).toBe(false)
  })

  it('restores attributes and removes DOM on destroy', () => {
    const input = document.querySelector<HTMLInputElement>('#place')!
    input.setAttribute('autocomplete', 'street-address')
    const controller = createAutocomplete(input, options())

    controller.destroy()

    expect(input.getAttribute('autocomplete')).toBe('street-address')
    expect(input.hasAttribute('role')).toBe(false)
    expect(document.querySelector('[data-autocomplete-list]')).toBeNull()
  })
})
