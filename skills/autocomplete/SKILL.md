---
name: autocomplete
description: Integrate @samline/autocomplete to turn a text input into an accessible combobox in vanilla JavaScript, TypeScript or plain HTML. Use it when suggestions come from an HTTP endpoint, an async function or a local array; do not use it for static select menus.
metadata:
  package: '@samline/autocomplete'
  package-version: '3.0.0'
---

# @samline/autocomplete

Build against the installed `@samline/autocomplete` version. This skill describes **3.0.0**. Check the dependency version before applying it, and preserve the host project's markup, components and design.

## The one contract

```js
import { createAutocomplete } from '@samline/autocomplete'
import '@samline/autocomplete/style.css'

const controller = createAutocomplete('#city', {
  endpoint: '/api/cities', // GET /api/cities?q=<query>
  getId: city => city.id,
  getLabel: city => city.name,
  onSelect: city => console.log(city),
})

controller.destroy() // on teardown
```

Keep the host's `<label for>` and `<input>`; wrap the input in an element with `position: relative`.

## Choose a loading mode

- **Package / ESM:** `npm install @samline/autocomplete`, import `createAutocomplete` (ESM or CommonJS) and optionally `@samline/autocomplete/style.css`.
- **HTML / CDN:** load `https://cdn.jsdelivr.net/npm/@samline/autocomplete@3.0.0/dist/style.css` and `.../dist/browser/autocomplete.global.js`, then `window.Autocomplete.newAutocomplete({ id: 'city', options })`. Read it back with `getAutocomplete(id)` and remove it with `destroyAutocomplete(id)`.

- **No JavaScript:** the browser bundle mounts `input[data-autocomplete="/api/url"]` or `input[data-autocomplete][data-autocomplete-source="#json-script"]`, configured with `data-autocomplete-*` attributes. Prefer it in CMS templates.

## Choose a source

Pass exactly one of `source`, `endpoint` or `sections`.

- `source: [...]` filters a local array in the browser, ignoring case and accents. Use `filter(item, query)` to change the match. Defaults: `minLength: 1`, `debounce: 0`.
- `source: (query, { signal, input }) => items` wraps any SDK, GraphQL client or worker. Pass `signal` to your request so dismissed searches abort.
- `endpoint` is a URL or `(query, input) => URL`. Set `queryParam: null` when the function builds the whole URL. `requestInit`, `parseResponse` and `mapResponse(payload, response, query)` adapt the request and the response shape.

- `sections: [{ id, label, source, maxResults? }]` searches several sources in parallel and renders labelled groups; events carry `section`.

Function and endpoint results are cached per query (`cache: { max: 50, ttl: 300000 }`). Use `cache: false` for data that must always be fresh, and `controller.clearCache()` after writes.

## Tune the behavior

`getId`, `getLabel` and `getValue` read your item shape. `minLength` (2), `debounce` (250), `maxResults` (8), `searchOnFocus` (true), `highlight` (true) and `messages` (`loading`, `empty`, `error`, `results`; each a string or `({ query, count }) => string`) tune the rest.

## Keep the form in sync

Prefer `hiddenInput: 'field_name'` (or `{ element, getValue }`) over a manual hidden field: it holds the selected id, empties when the text changes and dispatches `change`. `recent: true` shows recent selections on an empty input. Use `popover: true` when a parent has `overflow: hidden`.

Listen to bubbling events on the input: `autocomplete:select` (`{ suggestion, label, value }`), `autocomplete:clear`, `autocomplete:load` (`{ query, suggestions, cached }`), `autocomplete:loadstart` and `autocomplete:error`. Store ids in a hidden field on select and empty it on clear.

## Integrate with frameworks and extensions

- Bind state with `controller.getState()` and `controller.subscribe(fn)` (React `useSyncExternalStore`, Vue refs); listen with `controller.on('select', fn)`, which returns an unsubscribe function.
- Prefill edit forms with `controller.setValue(item)`; it dispatches no event.
- Shape behavior with `beforeSearch`, `transformSuggestions` and `beforeSelect`, or package them as `plugins: [{ name, setup(controller) }]`.
- For fully custom rendering, use `createSearch(options).run(query, { signal, input })`; you then own ARIA and keyboard support.

## Do not

- Do not add your own debounce, AbortController, cache or keyboard handling: the package owns them, and closing the list already cancels pending work.
- Do not inject HTML strings from suggestions. Use `renderOption(option, item, { query, highlight })`, append elements, and call `renderHighlight(element, highlight)` to reuse the highlighted label.
- Do not create a second controller for the same input; destroy the old one first.
