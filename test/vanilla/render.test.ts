import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createAutocomplete } from '../../src'

interface Place {
  key: string
  description: string
}

const places: Place[] = [
  { key: 'mx', description: 'Mexico City' },
  { key: 'mor', description: 'Cuernavaca, Morelos' },
]

const inputMarkup = (): void => {
  document.body.innerHTML = '<label for="place">Place</label><input id="place" class="original">'
}

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })

const options = () => ({
  endpoint: '/api/places',
  debounce: 0,
  mapResponse: (payload: unknown) => (payload as { results: Place[] }).results,
  getId: (place: Place) => place.key,
  getLabel: (place: Place) => place.description,
  getValue: (place: Place) => place.description,
})

describe('createAutocomplete', () => {
  beforeEach(() => {
    inputMarkup()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
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
      'Autocomplete requires a source or an endpoint.'
    )
    expect(() => createAutocomplete('#place', { endpoint: '/api', source: [] })).toThrow(
      'Autocomplete accepts either a source or an endpoint, not both.'
    )
  })

  it('configures an accessible combobox and listbox', () => {
    const controller = createAutocomplete('#place', options())

    expect(controller.element.getAttribute('role')).toBe('combobox')
    expect(controller.element.getAttribute('aria-autocomplete')).toBe('list')
    expect(controller.element.getAttribute('aria-controls')).toBe(controller.listElement.id)
    expect(controller.listElement.getAttribute('role')).toBe('listbox')
    expect(controller.listElement.hidden).toBe(true)
    expect(controller.listElement.getAttribute('aria-labelledby')).toBe(
      document.querySelector('label')!.id
    )
    expect(controller.popupElement.contains(controller.listElement)).toBe(true)
    expect(controller.liveElement.getAttribute('aria-live')).toBe('polite')
  })

  it('queries the configured endpoint and maps arbitrary payloads', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ results: places }))
    vi.stubGlobal('fetch', fetchMock)
    const controller = createAutocomplete('#place', {
      ...options(),
      queryParam: 'search',
      requestInit: { headers: { 'X-Client': 'test' } },
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
      requestInit: query => ({ headers: { 'X-Query': query } }),
      getLabel: place => place.description,
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

    const second = controller.listElement.querySelectorAll<HTMLElement>('[role="option"]')[1]!
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
      messages: { loading: 'Loading', empty: 'Nothing', error: 'Failed' },
    })

    const pending = controller.search('empty')
    expect(controller.statusElement.textContent).toBe('Loading')
    expect(controller.statusElement.dataset.autocompleteStatus).toBe('loading')
    expect(controller.liveElement.textContent).toBe('')
    await pending
    expect(controller.statusElement.textContent).toBe('Nothing')
    expect(controller.liveElement.textContent).toBe('Nothing')
    expect(controller.listElement.hidden).toBe(true)
    expect(controller.listElement.children).toHaveLength(0)

    response = jsonResponse({}, 500)
    await controller.search('error')
    expect(controller.statusElement.textContent).toBe('Failed')
    expect(controller.statusElement.dataset.autocompleteStatus).toBe('error')
    expect(controller.liveElement.textContent).toBe('Failed')
  })

  it('ignores stale responses and aborts the previous request', async () => {
    let resolveFirst: ((response: Response) => void) | undefined
    const first = new Promise<Response>(resolve => {
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
      () =>
        controller.element.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', cancelable: true })
        ),
      () => controller.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' })),
      () => document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true })),
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
    controller.element.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', cancelable: true })
    )
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
    controller.element.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', cancelable: true })
    )
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
    expect(document.querySelector('[data-autocomplete-live]')).toBeNull()
    expect(document.querySelector('label')!.hasAttribute('id')).toBe(false)
  })
  it('renders options as non-focusable elements with highlighted matches', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ results: places })))
    const controller = createAutocomplete('#place', options())
    await controller.search('mexico')

    const option = controller.listElement.querySelector<HTMLElement>('[role="option"]')!
    expect(option.tagName).toBe('DIV')
    expect(option.tabIndex).toBe(-1)
    expect(option.textContent).toBe('Mexico City')
    expect(option.querySelector('mark[data-autocomplete-highlight]')!.textContent).toBe('Mexico')
    expect(controller.liveElement.textContent).toBe('2 results available')
  })

  it('can disable highlighting', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ results: places })))
    const controller = createAutocomplete('#place', { ...options(), highlight: false })
    await controller.search('mexico')

    expect(controller.listElement.querySelector('mark')).toBeNull()
  })

  it('passes the query, index and highlight parts to renderOption', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ results: places })))
    const renderOption = vi.fn((element: HTMLElement, place: Place) => {
      const key = document.createElement('small')
      key.textContent = place.key
      element.append(key)
    })
    const controller = createAutocomplete('#place', { ...options(), renderOption })
    await controller.search('city')

    expect(renderOption).toHaveBeenCalledWith(expect.any(HTMLElement), places[0], {
      query: 'city',
      index: 0,
      label: 'Mexico City',
      highlight: [
        { text: 'Mexico ', match: false },
        { text: 'City', match: true },
      ],
    })
    expect(controller.listElement.querySelector('small')!.textContent).toBe('mx')
  })

  it('filters an array source locally without accents or case', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const cities = ['Cancún', 'Mérida', 'Monterrey', 'Morelia']
    const loaded = vi.fn()
    const controller = createAutocomplete('#place', { source: cities })
    controller.element.addEventListener('autocomplete:load', loaded)

    controller.element.value = 'MER'
    controller.element.dispatchEvent(new Event('input'))

    expect(fetchMock).not.toHaveBeenCalled()
    expect(controller.listElement.textContent).toBe('Mérida')
    expect(controller.listElement.querySelector('mark')!.textContent).toBe('Mér')
    expect(loaded.mock.calls[0]![0].detail).toEqual({
      query: 'MER',
      suggestions: ['Mérida'],
      cached: false,
    })

    await controller.search('can')
    expect(controller.listElement.textContent).toBe('Cancún')
  })

  it('accepts a custom local filter and normalizer', async () => {
    const controller = createAutocomplete('#place', {
      source: places,
      getLabel: place => place.description,
      filter: (place, query) => place.key.startsWith(query),
    })

    await controller.search('mo')
    expect(controller.listElement.textContent).toBe('Cuernavaca, Morelos')
  })

  it('calls a function source with the query, input and an abort signal', async () => {
    const source = vi.fn(async (query: string) =>
      places.filter(place => place.description.toLowerCase().includes(query))
    )
    const controller = createAutocomplete('#place', {
      source,
      getLabel: place => place.description,
    })

    await controller.search('city')

    expect(source).toHaveBeenCalledWith('city', {
      signal: expect.any(AbortSignal),
      input: controller.element,
    })
    expect(controller.listElement.textContent).toBe('Mexico City')
  })

  it('aborts the signal of a function source when dismissed', async () => {
    let signal: AbortSignal | undefined
    const controller = createAutocomplete('#place', {
      source: (_query, context) => {
        signal = context.signal
        return new Promise<Place[]>(() => {})
      },
    })

    void controller.search('city')
    controller.close()

    expect(signal!.aborted).toBe(true)
  })

  it('reports a function source that does not return an array', async () => {
    const onError = vi.fn()
    const controller = createAutocomplete('#place', {
      source: (async () => ({ nope: true })) as unknown as () => Promise<Place[]>,
      onError,
    })

    await controller.search('city')

    expect(onError.mock.calls[0]![0]).toBeInstanceOf(TypeError)
    expect(controller.statusElement.dataset.autocompleteStatus).toBe('error')
  })

  it('caches results per query and can clear the cache', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => jsonResponse({ results: places }))
    vi.stubGlobal('fetch', fetchMock)
    const controller = createAutocomplete('#place', options())
    const loaded = vi.fn()
    controller.element.addEventListener('autocomplete:load', loaded)

    await controller.search('mex')
    await controller.search('mex')
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(loaded.mock.calls[1]![0].detail.cached).toBe(true)
    expect(controller.listElement.textContent).toContain('Mexico City')

    controller.clearCache()
    await controller.search('mex')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('does not cache failures and honours cache: false and ttl', async () => {
    vi.useFakeTimers()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 500))
      .mockImplementation(async () => jsonResponse({ results: places }))
    vi.stubGlobal('fetch', fetchMock)

    const uncached = createAutocomplete('#place', { ...options(), cache: false })
    await uncached.search('mex')
    await uncached.search('mex')
    await uncached.search('mex')
    expect(fetchMock).toHaveBeenCalledTimes(3)
    uncached.destroy()

    fetchMock.mockClear()
    const short = createAutocomplete('#place', { ...options(), cache: { ttl: 1000 } })
    await short.search('mex')
    await short.search('mex')
    expect(fetchMock).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(1000)
    await short.search('mex')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('resolves message functions with the query and count', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ results: places })))
    const controller = createAutocomplete('#place', {
      ...options(),
      messages: {
        results: ({ count, query }) => `${count} resultados para ${query}`,
      },
    })

    await controller.search('me')
    expect(controller.liveElement.textContent).toBe('2 resultados para me')
  })

  it('validates cache options', () => {
    expect(() => createAutocomplete('#place', { ...options(), cache: { max: 0 } })).toThrow(
      'Autocomplete cache.max must be an integer greater than zero.'
    )
  })
})
