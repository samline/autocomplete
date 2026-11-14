import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  Autocomplete,
  createAutocomplete,
  createSearch,
  getMounted,
  mount,
  optionsFromDataset,
  unmount,
} from '../../src'
import type { AutocompletePlugin, AutocompleteState } from '../../src'

interface City {
  id: string
  name: string
}

const cities: City[] = [
  { id: 'mty', name: 'Monterrey' },
  { id: 'mor', name: 'Morelia' },
  { id: 'mer', name: 'Mérida' },
]

const key = (input: HTMLInputElement, name: string): void => {
  input.dispatchEvent(new KeyboardEvent('keydown', { key: name, cancelable: true }))
}

beforeEach(() => {
  document.body.innerHTML = '<label for="q">City</label><input id="q">'
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  })
})

afterEach(() => {
  unmount()
  document.body.innerHTML = ''
})

describe('createSearch', () => {
  it('runs synchronously for local arrays and returns ordered sections', () => {
    const search = createSearch<City>({
      sections: [
        { id: 'a', label: 'A', source: cities },
        { id: 'b', source: cities, maxResults: 1 },
      ],
      getLabel: city => city.name,
    })

    const result = search.run('mo', { signal: new AbortController().signal, input: null! })
    expect(result).not.toBeInstanceOf(Promise)
    expect(result).toMatchObject({
      query: 'mo',
      count: 3,
      cached: false,
      failed: false,
      sections: [
        { id: 'a', label: 'A', suggestions: [cities[0], cities[1]] },
        { id: 'b', suggestions: [cities[0]] },
      ],
    })
    expect(search.local).toBe(true)
  })

  it('returns a promise for remote sources and caches the result', async () => {
    const source = vi.fn(async () => cities)
    const search = createSearch<City>({ source, getLabel: city => city.name })
    const context = { signal: new AbortController().signal, input: null! }

    const first = search.run('mo', context)
    expect(first).toBeInstanceOf(Promise)
    expect((await first).sections[0]!.id).toBe('default')

    const second = search.run('mo', context)
    expect(second).not.toBeInstanceOf(Promise)
    expect((second as Awaited<typeof first>).cached).toBe(true)
    expect(source).toHaveBeenCalledOnce()
  })

  it('reports aborted runs', async () => {
    const controller = new AbortController()
    const search = createSearch<City>({
      source: (_query, { signal }) =>
        new Promise((_resolve, reject) =>
          signal.addEventListener('abort', () => reject(new DOMException('', 'AbortError')))
        ),
    })
    const pending = search.run('mo', { signal: controller.signal, input: null! })
    controller.abort()
    expect((await pending).aborted).toBe(true)
  })
})

describe('state, subscribe and on()', () => {
  it('publishes snapshots as the list opens, moves and selects', async () => {
    const controller = createAutocomplete<City>('#q', {
      source: cities,
      getLabel: city => city.name,
    })
    const states: AutocompleteState<City>[] = []
    const unsubscribe = controller.subscribe(state => states.push(state))
    const opened = vi.fn()
    const closed = vi.fn()
    controller.on('open', opened)
    const off = controller.on('close', closed)

    expect(controller.getState()).toMatchObject({ status: 'idle', open: false })
    await controller.search('mo')
    expect(controller.getState()).toMatchObject({
      query: 'mo',
      status: 'results',
      open: true,
      suggestions: [cities[0], cities[1]],
      activeIndex: -1,
    })
    expect(opened).toHaveBeenCalledWith({ query: 'mo' })

    key(controller.element, 'ArrowDown')
    expect(controller.getState().activeIndex).toBe(0)
    key(controller.element, 'Enter')
    expect(controller.getState()).toMatchObject({ open: false, selected: cities[0] })
    expect(closed).toHaveBeenCalledOnce()

    const count = states.length
    unsubscribe()
    off()
    await controller.search('me')
    expect(states).toHaveLength(count)
    expect(closed).toHaveBeenCalledOnce()
  })

  it('maps on() listeners to the event details', async () => {
    const controller = createAutocomplete<City>('#q', {
      source: cities,
      getLabel: city => city.name,
    })
    const loaded = vi.fn()
    const selected = vi.fn()
    controller.on('load', loaded)
    controller.on('select', selected)

    await controller.search('mer')
    key(controller.element, 'ArrowDown')
    key(controller.element, 'Enter')

    expect(loaded.mock.calls[0]![0].suggestions).toEqual([cities[2]])
    expect(selected.mock.calls[0]![0]).toMatchObject({ value: 'Mérida', section: null })
  })

  it('setValue prefills the input, selection and hidden input silently', () => {
    const controller = createAutocomplete<City>('#q', {
      source: cities,
      getLabel: city => city.name,
      hiddenInput: 'city_id',
    })
    const selected = vi.fn()
    controller.on('select', selected)

    controller.setValue(cities[1]!)
    expect(controller.element.value).toBe('Morelia')
    expect(controller.hiddenElement!.value).toBe('mor')
    expect(controller.getSelected()).toBe(cities[1])
    expect(selected).not.toHaveBeenCalled()

    controller.setValue(null)
    expect(controller.element.value).toBe('')
    expect(controller.getSelected()).toBeNull()
  })
})

describe('hooks', () => {
  it('beforeSearch rewrites or skips the query', async () => {
    const controller = createAutocomplete<City>('#q', {
      source: cities,
      getLabel: city => city.name,
      beforeSearch: query => (query === 'skip' ? false : query.replace('#', '')),
    })

    await controller.search('#mor')
    expect(controller.getState().query).toBe('mor')
    expect(controller.listElement.textContent).toBe('Morelia')

    await controller.search('skip')
    expect(controller.getState().open).toBe(false)
  })

  it('transformSuggestions runs before maxResults', async () => {
    const controller = createAutocomplete<City>('#q', {
      source: cities,
      getLabel: city => city.name,
      maxResults: 1,
      transformSuggestions: (items, { section }) => {
        expect(section).toBeNull()
        return [...items].reverse()
      },
    })

    await controller.search('m')
    expect(controller.listElement.textContent).toBe('Mérida')
  })

  it('beforeSelect can veto a selection', async () => {
    const controller = createAutocomplete<City>('#q', {
      source: cities,
      getLabel: city => city.name,
      beforeSelect: city => city.id !== 'mty',
    })

    await controller.search('mo')
    key(controller.element, 'ArrowDown')
    key(controller.element, 'Enter')
    expect(controller.getSelected()).toBeNull()
    expect(controller.getState().open).toBe(true)
  })
})

describe('plugins', () => {
  it('sets up with the controller, chains hooks and cleans up', async () => {
    const teardown = vi.fn()
    const seen: string[] = []
    const track: AutocompletePlugin<City> = {
      name: 'track',
      setup: controller => {
        const off = controller.on('select', ({ value }) => seen.push(value))
        return {
          beforeSearch: query => query.toLowerCase(),
          transformSuggestions: items => items.filter(city => city.id !== 'mty'),
          destroy: () => {
            off()
            teardown()
          },
        }
      },
    }
    const controller = createAutocomplete<City>('#q', {
      source: cities,
      getLabel: city => city.name,
      beforeSearch: query => query.trim(),
      plugins: [track],
    })

    await controller.search('MO')
    expect(controller.listElement.textContent).toBe('Morelia')
    key(controller.element, 'ArrowDown')
    key(controller.element, 'Enter')
    expect(seen).toEqual(['Morelia'])

    controller.destroy()
    expect(teardown).toHaveBeenCalledOnce()
  })

  it('validates plugins', () => {
    expect(() =>
      createAutocomplete('#q', { source: [], plugins: [{ name: 'x' } as AutocompletePlugin] })
    ).toThrow('Autocomplete plugins need a name and a setup function.')
  })
})

describe('declarative mount', () => {
  it('reads options from data attributes', () => {
    document.body.innerHTML = `
      <script type="application/json" id="states">[{"code":"MX","title":"Mexico"}]</script>
      <input id="a" data-autocomplete data-autocomplete-source="#states"
        data-autocomplete-label-key="title" data-autocomplete-id-key="code"
        data-autocomplete-min-length="0" data-autocomplete-popover
        data-autocomplete-highlight="false" data-autocomplete-query-param=""
        data-autocomplete-recent data-autocomplete-recent-label="Recent"
        data-autocomplete-hidden-input="state" data-autocomplete-empty="Nada">`
    const options = optionsFromDataset(document.querySelector<HTMLInputElement>('#a')!)

    expect(options).toMatchObject({
      source: [{ code: 'MX', title: 'Mexico' }],
      minLength: 0,
      popover: true,
      highlight: false,
      queryParam: null,
      recent: { label: 'Recent' },
      hiddenInput: 'state',
      messages: { empty: 'Nada' },
    })
    expect(options.getLabel!({ code: 'MX', title: 'Mexico' })).toBe('Mexico')
    expect(options.getValue!({ code: 'MX', title: 'Mexico' })).toBe('Mexico')
    expect(options.getId!({ code: 'MX', title: 'Mexico' }, 0)).toBe('MX')
  })

  it('reads an endpoint and inline JSON', () => {
    document.body.innerHTML = `<input id="e" data-autocomplete="/api/cities" data-autocomplete-debounce="100">
      <input id="j" data-autocomplete data-autocomplete-source='["a","b"]'>`
    expect(optionsFromDataset(document.querySelector<HTMLInputElement>('#e')!)).toMatchObject({
      endpoint: '/api/cities',
      debounce: 100,
    })
    expect(optionsFromDataset(document.querySelector<HTMLInputElement>('#j')!).source).toEqual([
      'a',
      'b',
    ])
  })

  it('mounts existing and added inputs, registers ids and releases removed ones', async () => {
    document.body.innerHTML = `<input id="first" data-autocomplete data-autocomplete-source='["Lima","Lisboa"]'>`
    const renderOption = vi.fn()
    mount({ defaults: { renderOption } })

    const first = Autocomplete.getAutocomplete('first')!
    expect(first).toBeTruthy()
    await first.search('li')
    expect(renderOption).toHaveBeenCalledTimes(2)

    const added = document.createElement('div')
    added.innerHTML = `<input id="second" data-autocomplete data-autocomplete-source='["Roma"]'>`
    document.body.append(added)
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(Autocomplete.getAutocomplete('second')).toBeTruthy()
    expect(getMounted().size).toBe(2)

    added.remove()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(Autocomplete.getAutocomplete('second')).toBeNull()
    expect(getMounted().size).toBe(1)

    unmount()
    expect(getMounted().size).toBe(0)
    expect(document.querySelector('[data-autocomplete-list]')).toBeNull()
  })

  it('logs and skips inputs whose attributes are invalid', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    document.body.innerHTML = `<input id="bad" data-autocomplete>`
    mount()
    expect(error).toHaveBeenCalledOnce()
    expect(getMounted().size).toBe(0)
  })
})
