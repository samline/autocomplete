---
locale: en
sidebar:
  group: start
  order: 2
title: 'Install and search'
titleAccent: 'search'
description: 'Install @samline/autocomplete with a package manager or a script tag, add the input and create your first remote search.'
---

## Package / ESM

```sh
npm install @samline/autocomplete
```

```html
<div class="field" style="position: relative">
  <label for="city">City</label>
  <input id="city" type="text" />
</div>
```

```js
import { createAutocomplete } from '@samline/autocomplete'
import '@samline/autocomplete/styles.css'

const controller = createAutocomplete('#city', {
  endpoint: '/api/cities',
  getId: city => city.id,
  getLabel: city => city.name,
  onSelect: city => console.log('Selected', city),
})
```

The request is `GET /api/cities?q=<query>`. Return an array, or an object with `suggestions`, `items` or `data`; otherwise use `mapResponse`. The wrapper around the input needs `position: relative`, because the default list is absolutely positioned under it.

## HTML / CDN

For Shopify, WordPress or plain HTML pages without a build step, load the stylesheet and the browser bundle. Pin the version in production.

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@samline/autocomplete@1.0.0/dist/styles.css"
/>
<script src="https://cdn.jsdelivr.net/npm/@samline/autocomplete@1.0.0/dist/browser/global.global.js"></script>
<script>
  window.Autocomplete.create('#city', { endpoint: '/api/cities' })
</script>
```

`Autocomplete.create` requires an input with an `id` and stores the controller in `Autocomplete.available[id]`; `Autocomplete.destroy(id)` removes it. `Autocomplete.autocomplete(input, options)` creates one without the registry.

## Frameworks and CMS

There is no adapter: create the controller once the input exists in the DOM and destroy it when the input leaves. In React:

```jsx
import { useEffect, useRef } from 'react'
import { createAutocomplete } from '@samline/autocomplete'

export function CitySearch() {
  const input = useRef(null)

  useEffect(() => {
    const controller = createAutocomplete(input.current, { endpoint: '/api/cities' })
    return () => controller.destroy()
  }, [])

  return (
    <div style={{ position: 'relative' }}>
      <label htmlFor="city">City</label>
      <input id="city" ref={input} type="text" />
    </div>
  )
}
```

Vue (`onMounted` / `onBeforeUnmount`) and Svelte (`onMount` returning the cleanup) follow the same pattern. In Shopify themes or WordPress, use the HTML / CDN files and call `window.Autocomplete.create` after the input is in the page.

## Requirements

- Modern browsers with `fetch` and `AbortController`. Node 20 or newer for server-side imports.
- No runtime dependencies. The stylesheet is optional.

## Working starter files

A complete page that runs as-is. It searches the public list of cities used by these docs.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Autocomplete starter</title>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/@samline/autocomplete@1.0.0/dist/styles.css"
    />
  </head>
  <body>
    <div style="position: relative; max-width: 28rem">
      <label for="city">City</label>
      <input id="city" type="text" />
    </div>
    <script src="https://cdn.jsdelivr.net/npm/@samline/autocomplete@1.0.0/dist/browser/global.global.js"></script>
    <script>
      window.Autocomplete.create('#city', {
        endpoint: 'https://samline.github.io/autocomplete/cities.json',
        mapResponse: (payload, response, query) =>
          payload.results.filter(city => city.name.toLowerCase().includes(query.toLowerCase())),
        getId: city => city.key,
        getLabel: city => city.name,
      })
    </script>
  </body>
</html>
```
