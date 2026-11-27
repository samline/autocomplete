import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createAutocomplete, createRecentStore } from '../../src'

interface City {
  id: string
  name: string
}

const cities: City[] = [
  { id: 'mty', name: 'Monterrey' },
  { id: 'mor', name: 'Morelia' },
]
const people = [{ id: 'mo', name: 'Mónica' }]

const type = (input: HTMLInputElement, value: string): void => {
  input.value = value
  input.dispatchEvent(new Event('input'))
}

describe('sections', () => {
  beforeEach(() => {
    document.body.innerHTML = '<form><label for="q">Search</label><input id="q"></form>'
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    })
    localStorage.clear()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders labelled groups in order with one keyboard sequence', async () => {
    const controller = createAutocomplete<City>('#q', {
      sections: [
        { id: 'cities', label: 'Cities', source: cities },
        { id: 'people', label: 'People', source: async () => people },
      ],
      getLabel: item => item.name,
      debounce: 0,
    })
    const loaded = vi.fn()
    const selected = vi.fn()
    controller.element.addEventListener('autocomplete:load', loaded)
    controller.element.addEventListener('autocomplete:select', selected)

    await controller.search('mo')

    const groups = controller.listElement.querySelectorAll('[role="group"]')
    expect(groups).toHaveLength(2)
    expect(groups[0]!.getAttribute('data-autocomplete-group')).toBe('cities')
    const heading = groups[0]!.querySelector('[data-autocomplete-group-label]')!
    expect(heading.textContent).toBe('Cities')
    expect(groups[0]!.getAttribute('aria-labelledby')).toBe(heading.id)
    expect(controller.listElement.querySelectorAll('[role="option"]')).toHaveLength(3)
    expect(
      loaded.mock.calls[0]![0].detail.sections.map((section: { id: string }) => section.id)
    ).toEqual(['cities', 'people'])

    controller.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }))
    controller.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(controller.element.value).toBe('Mónica')
    expect(selected.mock.calls[0]![0].detail.section).toBe('people')
  })

  it('keeps the other sections when one fails, and errors when all fail', async () => {
    const onError = vi.fn()
    const errors = vi.fn()
    const controller = createAutocomplete<City>('#q', {
      sections: [
        { id: 'cities', label: 'Cities', source: async () => cities },
        { id: 'broken', label: 'Broken', source: async () => Promise.reject(new Error('down')) },
      ],
      getLabel: item => item.name,
      onError,
    })
    controller.element.addEventListener('autocomplete:error', errors)

    await controller.search('mo')
    expect(controller.listElement.querySelectorAll('[role="option"]')).toHaveLength(2)
    expect(errors.mock.calls[0]![0].detail.section).toBe('broken')
    expect(onError).toHaveBeenCalledOnce()

    const failing = createAutocomplete('#q', {
      sections: [{ id: 'broken', source: async () => Promise.reject(new Error('down')) }],
    })
    await failing.search('mo')
    expect(failing.statusElement.dataset.autocompleteStatus).toBe('error')
  })

  it('caches each section and limits results per section', async () => {
    const remote = vi.fn(async () => cities)
    const controller = createAutocomplete<City>('#q', {
      sections: [{ id: 'cities', source: remote, maxResults: 1 }],
      getLabel: item => item.name,
    })

    await controller.search('mo')
    await controller.search('mo')

    expect(remote).toHaveBeenCalledOnce()
    expect(controller.listElement.querySelectorAll('[role="option"]')).toHaveLength(1)
    // Unlabelled sections render options without a group wrapper.
    expect(controller.listElement.querySelector('[role="group"]')).toBeNull()
  })

  it('validates section ids', () => {
    expect(() =>
      createAutocomplete('#q', {
        sections: [
          { id: 'a', source: [] },
          { id: 'a', source: [] },
        ],
      })
    ).toThrow('Autocomplete section id "a" is repeated.')
    expect(() => createAutocomplete('#q', { sections: [] })).toThrow(
      'Autocomplete sections must be a non-empty array.'
    )
    expect(() =>
      createAutocomplete('#q', { recent: true, sections: [{ id: 'recent', source: [] }] })
    ).toThrow('reserved')
  })
})

describe('recent selections', () => {
  beforeEach(() => {
    document.body.innerHTML = '<label for="q">Search</label><input id="q">'
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    })
    localStorage.clear()
  })

  it('stores selections and shows them on focus when the input is empty', async () => {
    const controller = createAutocomplete<City>('#q', {
      source: cities,
      getLabel: item => item.name,
      recent: { label: 'Recientes' },
    })
    controller.element.focus()
    expect(controller.popupElement.hidden).toBe(true)

    type(controller.element, 'mor')
    controller.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    controller.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(JSON.parse(localStorage.getItem('autocomplete:recent:q')!)).toEqual([cities[1]])

    type(controller.element, '')
    const group = controller.listElement.querySelector('[data-autocomplete-group="recent"]')!
    expect(group.querySelector('[data-autocomplete-group-label]')!.textContent).toBe('Recientes')
    expect(group.textContent).toContain('Morelia')
    expect(controller.recent!.get()).toEqual([cities[1]])
  })

  it('opens recents with ArrowDown on an empty input', () => {
    const store = createRecentStore<City>({ storage: null })
    store.add(cities[0]!)
    const controller = createAutocomplete<City>('#q', {
      source: cities,
      getLabel: item => item.name,
      recent: { store },
    })

    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true })
    controller.element.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(controller.listElement.textContent).toContain('Monterrey')
  })
})

describe('createRecentStore', () => {
  it('keeps the most recent first, without duplicates, up to max', () => {
    const store = createRecentStore<string>({ key: 'test', max: 2, storage: null })
    store.add('a')
    store.add('b')
    store.add('a')
    store.add('c')
    expect(store.get()).toEqual(['c', 'a'])
    store.remove('a')
    expect(store.get()).toEqual(['c'])
    store.clear()
    expect(store.get()).toEqual([])
  })

  it('falls back to memory when storage throws', () => {
    const storage = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {},
    }
    const store = createRecentStore<string>({ key: 'test', storage })
    store.add('a')
    expect(store.get()).toEqual(['a'])
  })
})

describe('hidden input', () => {
  beforeEach(() => {
    document.body.innerHTML = '<form><input id="q"><input type="hidden" id="existing"></form>'
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    })
  })

  it('creates a named hidden input with the id and clears it on edit', async () => {
    const controller = createAutocomplete<City>('#q', {
      source: cities,
      getLabel: item => item.name,
      hiddenInput: 'city_id',
    })
    const changed = vi.fn()
    controller.hiddenElement!.addEventListener('change', changed)

    await controller.search('mon')
    controller.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    controller.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))

    const data = new FormData(document.querySelector('form')!)
    expect(data.get('city_id')).toBe('mty')
    expect(changed).toHaveBeenCalledOnce()

    type(controller.element, 'other')
    expect(controller.hiddenElement!.value).toBe('')

    controller.destroy()
    expect(document.querySelector('[data-autocomplete-hidden]')).toBeNull()
  })

  it('fills an existing input with a custom value and keeps it on destroy', async () => {
    const controller = createAutocomplete<City>('#q', {
      source: cities,
      getLabel: item => item.name,
      hiddenInput: { element: '#existing', getValue: city => city.name.toUpperCase() },
    })

    await controller.search('mor')
    controller.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    controller.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(controller.hiddenElement!.value).toBe('MORELIA')

    controller.clear()
    expect(controller.hiddenElement!.value).toBe('')
    controller.destroy()
    expect(document.querySelector('#existing')).not.toBeNull()
  })
})

describe('templates and placement', () => {
  beforeEach(() => {
    document.body.innerHTML = '<input id="q">'
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    })
  })

  it('renders a header and footer with the results context', async () => {
    const controller = createAutocomplete<City>('#q', {
      source: cities,
      getLabel: item => item.name,
      renderHeader: (element, { count }) => {
        element.textContent = `${count} cities`
      },
      renderFooter: (element, { query }) => {
        const link = document.createElement('a')
        link.href = `/search?q=${query}`
        link.textContent = 'See all'
        element.append(link)
      },
    })

    await controller.search('mo')
    const header = controller.popupElement.querySelector<HTMLElement>('[data-autocomplete-header]')!
    const footer = controller.popupElement.querySelector<HTMLElement>('[data-autocomplete-footer]')!
    expect(header.textContent).toBe('2 cities')
    expect(footer.querySelector('a')!.getAttribute('href')).toBe('/search?q=mo')
    expect(controller.listElement.contains(footer)).toBe(false)

    await controller.search('zz')
    expect(header.hidden).toBe(true)
    expect(footer.hidden).toBe(true)
  })

  it('lets renderStatus replace the visible state', async () => {
    const controller = createAutocomplete<City>('#q', {
      source: async () => Promise.reject(new Error('down')),
      renderStatus: (element, context) => {
        if (context.state !== 'error') return
        const retry = document.createElement('button')
        retry.textContent = `Retry ${context.query} (${String((context.error as Error).message)})`
        element.replaceChildren(retry)
      },
    })

    await controller.search('mo')
    expect(controller.statusElement.querySelector('button')!.textContent).toBe('Retry mo (down)')
    expect(controller.liveElement.textContent).toBe('Search failed')
  })

  it('flips above the input when there is no room below', async () => {
    const controller = createAutocomplete<City>('#q', {
      source: cities,
      getLabel: item => item.name,
    })
    vi.spyOn(controller.element, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ x: 0, y: 700, width: 200, height: 40 })
    )
    vi.spyOn(controller.popupElement, 'offsetHeight', 'get').mockReturnValue(200)
    vi.stubGlobal('innerHeight', 768)

    await controller.search('mo')
    expect(controller.popupElement.dataset.placement).toBe('top')

    vi.unstubAllGlobals()
  })

  it('re-measures the natural height on re-render and flips to the roomier side', async () => {
    const controller = createAutocomplete<City>('#q', {
      source: cities,
      getLabel: item => item.name,
    })
    vi.spyOn(controller.element, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ x: 0, y: 500, width: 200, height: 40 })
    )
    // Natural list height; an inline max-height clamps it like `overflow-y: auto` does.
    let natural = 40
    vi.spyOn(controller.popupElement, 'offsetHeight', 'get').mockImplementation(() =>
      controller.popupElement.style.maxHeight ? Math.min(natural, 56) : natural
    )
    vi.stubGlobal('innerHeight', 600)

    // 40px of list fits in the 60px below the input: stays below, capped to 56px.
    await controller.search('mo')
    expect(controller.popupElement.dataset.placement).toBe('bottom')
    expect(controller.popupElement.style.maxHeight).toContain('56px')

    // A long list no longer fits below (clamped height would read 56 and stay put); 500px above is roomier.
    natural = 300
    await controller.search('m')
    expect(controller.popupElement.dataset.placement).toBe('top')
    expect(controller.popupElement.style.maxHeight).toContain('496px')

    vi.unstubAllGlobals()
  })

  it('measures free space against the visual viewport and caps the list height', async () => {
    const controller = createAutocomplete<City>('#q', {
      source: cities,
      getLabel: item => item.name,
    })
    vi.spyOn(controller.element, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ x: 0, y: 300, width: 200, height: 40 })
    )
    vi.spyOn(controller.popupElement, 'offsetHeight', 'get').mockReturnValue(200)
    vi.stubGlobal('innerHeight', 900)
    // The on-screen keyboard leaves only 420px visible: 80px below the input, 300px above (minus the 4px offset).
    vi.stubGlobal('visualViewport', {
      height: 420,
      offsetTop: 0,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    await controller.search('mo')
    expect(controller.popupElement.dataset.placement).toBe('top')
    expect(controller.popupElement.style.maxHeight).toContain('296px')

    controller.close()
    expect(controller.popupElement.style.maxHeight).toBe('')

    vi.unstubAllGlobals()
  })

  it('repositions on visual viewport changes while open in popover mode and cleans up', async () => {
    const show = vi.fn()
    const hide = vi.fn()
    Object.assign(HTMLElement.prototype, { showPopover: show, hidePopover: hide })
    const matches = vi.spyOn(HTMLElement.prototype, 'matches').mockImplementation(function (
      this: HTMLElement,
      selector: string
    ) {
      return selector === ':popover-open' ? show.mock.calls.length > hide.mock.calls.length : false
    })
    const add = vi.fn()
    const remove = vi.fn()
    vi.stubGlobal('visualViewport', {
      height: 600,
      offsetTop: 0,
      addEventListener: add,
      removeEventListener: remove,
    })

    const controller = createAutocomplete<City>('#q', {
      source: cities,
      getLabel: item => item.name,
      popover: true,
    })
    await controller.search('mo')
    expect(add.mock.calls.map(call => call[0]).sort()).toEqual(['resize', 'scroll'])

    controller.destroy()
    expect(remove.mock.calls.map(call => call[0]).sort()).toEqual(['resize', 'scroll'])

    vi.unstubAllGlobals()
    matches.mockRestore()
    delete (HTMLElement.prototype as { showPopover?: unknown }).showPopover
    delete (HTMLElement.prototype as { hidePopover?: unknown }).hidePopover
  })

  it('honours a fixed placement and validates it', async () => {
    const controller = createAutocomplete<City>('#q', {
      source: cities,
      getLabel: item => item.name,
      placement: 'bottom',
    })
    await controller.search('mo')
    expect(controller.popupElement.dataset.placement).toBe('bottom')

    expect(() => createAutocomplete('#q', { source: [], placement: 'left' as 'top' })).toThrow(
      'placement'
    )
  })

  it('uses the Popover API when available', async () => {
    const show = vi.fn()
    const hide = vi.fn()
    Object.assign(HTMLElement.prototype, { showPopover: show, hidePopover: hide })
    const matches = vi.spyOn(HTMLElement.prototype, 'matches').mockImplementation(function (
      this: HTMLElement,
      selector: string
    ) {
      return selector === ':popover-open' ? show.mock.calls.length > hide.mock.calls.length : false
    })

    const controller = createAutocomplete<City>('#q', {
      source: cities,
      getLabel: item => item.name,
      popover: true,
    })
    expect(controller.popupElement.getAttribute('popover')).toBe('manual')

    await controller.search('mo')
    expect(show).toHaveBeenCalledOnce()
    expect(controller.popupElement.style.position).toBe('fixed')

    controller.close()
    expect(hide).toHaveBeenCalledOnce()

    matches.mockRestore()
    delete (HTMLElement.prototype as { showPopover?: unknown }).showPopover
    delete (HTMLElement.prototype as { hidePopover?: unknown }).hidePopover
  })
})
