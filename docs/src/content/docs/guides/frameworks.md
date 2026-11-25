---
locale: en
sidebar:
  group: guides
  order: 4
title: 'Framework integrations'
titleAccent: 'integrations'
description: 'Use @samline/autocomplete in React, Vue, Svelte, Astro and plain HTML or CDN pages: create on mount, destroy on unmount, bind the observable state.'
---

There is no adapter package. `createAutocomplete(input, options)` takes the real `<input>` and returns a controller, so every framework follows the same lifecycle: create it once the element exists, call `destroy()` when the component leaves (it is idempotent and removes every listener and the listbox), and read the state through the controller.

The controller exposes an observable state for bindings: `getState()` returns the current snapshot (`query`, `status`, `open`, `suggestions`, `sections`, `activeIndex`, `selected`), and `subscribe(listener)` calls you with each new snapshot and returns an unsubscribe function. `on(event, listener)` listens to `select`, `clear`, `load` and the other `autocomplete:*` events. Import the optional stylesheet once with `import '@samline/autocomplete/style.css'`, and give the input a `position: relative` wrapper.

Importing the package never touches `window` or `document`, so server rendering is safe; create the controller only on the client.

## React

`subscribe` and `getState` plug straight into `useSyncExternalStore`. The effect destroys the controller on unmount and on the development setup/cleanup cycle.

```jsx
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createAutocomplete } from '@samline/autocomplete'
import '@samline/autocomplete/style.css'

const idle = { status: 'idle', open: false, suggestions: [], selected: null }

export const useAutocomplete = options => {
  const ref = useRef(null)
  const [controller, setController] = useState(null)

  useEffect(() => {
    const instance = createAutocomplete(ref.current, options)
    setController(instance)
    return () => instance.destroy()
  }, [])

  const state = useSyncExternalStore(
    listener => controller?.subscribe(listener) ?? (() => {}),
    () => controller?.getState() ?? idle
  )

  return { ref, controller, state }
}

export const CitySearch = () => {
  const { ref, state } = useAutocomplete({ endpoint: '/api/cities', getLabel: city => city.name })

  return (
    <div style={{ position: 'relative' }}>
      <label htmlFor="city">City</label>
      <input id="city" ref={ref} />
      <p>{state.selected ? `Selected ${state.selected.name}` : 'Nothing selected'}</p>
    </div>
  )
}
```

## Vue

```vue
<script setup>
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { createAutocomplete } from '@samline/autocomplete'
import '@samline/autocomplete/style.css'

const input = ref(null)
const state = shallowRef(null)
let controller

onMounted(() => {
  controller = createAutocomplete(input.value, {
    endpoint: '/api/cities',
    getLabel: city => city.name,
  })
  state.value = controller.getState()
  controller.subscribe(next => (state.value = next))
})
onBeforeUnmount(() => controller?.destroy())
</script>

<template>
  <div style="position: relative">
    <label for="city">City</label>
    <input id="city" ref="input" />
    <p>{{ state?.selected ? `Selected ${state.selected.name}` : 'Nothing selected' }}</p>
  </div>
</template>
```

## Svelte

An action creates the controller when the node mounts and destroys it when the node leaves. Wrap the state in a store with `subscribe`: a Svelte store only needs a `subscribe` method that returns an unsubscribe function, which is exactly what the controller provides.

```svelte
<script>
  import { createAutocomplete } from '@samline/autocomplete'
  import '@samline/autocomplete/style.css'

  let selected = null

  const search = (node, options) => {
    const controller = createAutocomplete(node, options)
    const stop = controller.subscribe(state => (selected = state.selected))
    return {
      destroy: () => {
        stop()
        controller.destroy()
      },
    }
  }
</script>

<div style="position: relative">
  <label for="city">City</label>
  <input id="city" use:search={{ endpoint: '/api/cities', getLabel: city => city.name }} />
  <p>{selected ? `Selected ${selected.name}` : 'Nothing selected'}</p>
</div>
```

## Astro

Astro renders the markup on the server, so create the controller in a processed client `<script>`. With the data attributes you do not even write the controller: call `mount()` and it enhances every `input[data-autocomplete]`, including inputs added later, and destroys the ones that leave the document.

```astro
---
import '@samline/autocomplete/style.css'
---

<div style="position: relative">
  <label for="city">City</label>
  <input
    id="city"
    data-autocomplete="/api/cities"
    data-autocomplete-label-key="name"
    data-autocomplete-id-key="id"
  />
</div>

<script>
  import { mount } from '@samline/autocomplete'

  mount()
</script>
```

For options that attributes cannot express, such as `renderOption`, pass `mount({ defaults })`. If you need the controller itself, call `createAutocomplete(document.querySelector('#city'), options)` in the same script. With Astro view transitions, destroy the controller before the swap (for example on `astro:before-swap`) and create it again on `astro:page-load`; `mount()` already handles replaced inputs by itself.

## Plain HTML and CDN

The standalone script mounts every `input[data-autocomplete]` on load and as inputs are added or removed, so no framework code is needed. Mounted inputs with an id are available through `Autocomplete.getAutocomplete(id)`, and `Autocomplete.destroyAutocomplete(id)` releases one.

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@samline/autocomplete@3.0.0/dist/style.css"
/>

<div style="position: relative">
  <label for="city">City</label>
  <input id="city" data-autocomplete="/api/cities" data-autocomplete-label-key="name" />
  <p id="picked">Nothing selected</p>
</div>

<script src="https://cdn.jsdelivr.net/npm/@samline/autocomplete@3.0.0/dist/browser/autocomplete.global.js"></script>
<script>
  // The standalone script mounts on DOMContentLoaded; this listener runs right after it.
  document.addEventListener('DOMContentLoaded', function () {
    Autocomplete.getAutocomplete('city').subscribe(function (state) {
      document.getElementById('picked').textContent = state.selected
        ? 'Selected ' + state.selected.name
        : 'Nothing selected'
    })
  })
</script>
```

The same API runs in Shopify themes and WordPress templates, which are plain HTML pages as far as the script is concerned. More patterns, including Alpine, Livewire forms, a command palette, plugins and headless search, are in the [recipes](../recipes/).
