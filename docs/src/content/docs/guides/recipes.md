---
locale: en
sidebar:
  group: guides
  order: 5
title: 'Recipes for your stack'
titleAccent: 'your stack'
description: 'Plain HTML with data attributes, Alpine wrappers, Livewire forms, a command palette, plugins and a fully headless search.'
---

Every recipe uses the public API only; there is no adapter package to install.

## Plain HTML, no JavaScript

The standalone script mounts every `input[data-autocomplete]` on load and as inputs are added or removed.

```html
<script type="application/json" id="states">
  ["Jalisco", "Michoacán", "Nuevo León", "Querétaro", "Yucatán"]
</script>

<label for="state">State</label>
<input id="state" data-autocomplete data-autocomplete-source="#states" />

<label for="city">City</label>
<input
  id="city"
  data-autocomplete="/api/cities"
  data-autocomplete-label-key="name"
  data-autocomplete-id-key="id"
  data-autocomplete-hidden-input="city_id"
  data-autocomplete-recent
/>

<script src="https://cdn.jsdelivr.net/npm/@samline/autocomplete@3.0.0/dist/browser/autocomplete.global.js"></script>
```

Mounted inputs with an id are available through `Autocomplete.getAutocomplete(id)`. With a bundler, call `mount({ defaults })` yourself; `defaults` carries options that attributes cannot express, such as `renderOption`.

## React and Vue

The React hook and the Vue composable live in [Framework integrations](../frameworks/), together with Svelte, Astro and plain HTML. The pattern is the same everywhere: create on mount, `destroy()` on unmount, and bind `getState` / `subscribe`.

## Alpine

```html
<div
  x-data="{ city: null }"
  x-init="
    const controller = Autocomplete.autocomplete($refs.input, { endpoint: '/api/cities' })
    controller.on('select', ({ suggestion }) => (city = suggestion))
    controller.on('clear', () => (city = null))
  "
  style="position: relative"
>
  <label for="city">City</label>
  <input id="city" x-ref="input" />
  <p x-text="city ? city.name : 'Nothing selected'"></p>
</div>
```

## Server-rendered forms (Laravel, Rails, Django, Livewire)

`hiddenInput` submits the id with the form. `setValue` prefills an edit form without dispatching events.

```js
const controller = createAutocomplete('#city', {
  endpoint: '/cities/search',
  getId: city => city.id,
  getLabel: city => city.name,
  hiddenInput: 'city_id',
})

// Editing an existing record:
controller.setValue({ id: 42, name: 'Guadalajara' })
```

The hidden input dispatches a bubbling `change` event when its value changes. With Livewire, push the selection explicitly so the component never depends on hidden-field events:

```js
controller.on('select', ({ suggestion }) => $wire.set('cityId', suggestion.id))
controller.on('clear', () => $wire.set('cityId', null))
```

## Command palette

Sections and recent selections make a ⌘K palette in a few lines. `popover: true` keeps it above dialogs and clipped containers.

```js
const palette = createAutocomplete('#palette', {
  sections: [
    { id: 'actions', label: 'Actions', source: [{ id: 'new', label: 'New document' }] },
    { id: 'pages', label: 'Pages', source: (query, { signal }) => searchPages(query, { signal }) },
  ],
  minLength: 1,
  recent: { label: 'Recent' },
  popover: true,
  onSelect: item => run(item),
})

document.addEventListener('keydown', event => {
  if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault()
    palette.element.focus()
  }
})
```

## Plugins

A plugin is a name and a `setup(controller)` function. It can listen with `on()` and `subscribe()`, and return hooks plus a `destroy` callback. Hooks from the options run first, then each plugin in order.

```js
const analytics = track => ({
  name: 'analytics',
  setup: controller => {
    const offLoad = controller.on('load', ({ query, suggestions }) =>
      track('autocomplete_search', { query, results: suggestions.length })
    )
    const offSelect = controller.on('select', ({ value, section }) =>
      track('autocomplete_select', { value, section })
    )
    return {
      destroy: () => {
        offLoad()
        offSelect()
      },
    }
  },
})

const dedupe = getKey => ({
  name: 'dedupe',
  setup: () => ({
    transformSuggestions: items =>
      items.filter(
        (item, index) => items.findIndex(other => getKey(other) === getKey(item)) === index
      ),
  }),
})

createAutocomplete('#city', {
  endpoint: '/api/cities',
  plugins: [analytics(window.track), dedupe(city => city.id)],
})
```

The hooks are also plain options: `beforeSearch(query, input)` returns a new query or `false` to skip, `transformSuggestions(items, { query, section })` reorders before `maxResults` applies, and `beforeSelect(item, input)` returns `false` to keep the list open.

## Headless

`createSearch` is the DOM-free pipeline behind every controller: sources, sections, local filtering, caching and partial failures. Render the results however you like.

```js
import { createSearch } from '@samline/autocomplete'

const search = createSearch({
  sections: [
    { id: 'cities', label: 'Cities', source: cities },
    { id: 'people', label: 'People', source: (query, { signal }) => api.people(query, { signal }) },
  ],
})

let controller
input.addEventListener('input', async () => {
  controller?.abort()
  controller = new AbortController()
  const result = await search.run(input.value, { signal: controller.signal, input })
  if (result.aborted) return
  render(result.sections)
})
```

`run()` returns the result directly when every section is a local array or a cache hit, and a promise otherwise, so `await` covers both. You keep responsibility for ARIA and keyboard support when you render yourself.
