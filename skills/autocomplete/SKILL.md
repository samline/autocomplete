---
name: autocomplete
description: Integrate @samline/autocomplete to turn a text input into an accessible remote combobox in vanilla JavaScript, TypeScript or plain HTML. Use it when suggestions come from an HTTP endpoint; do not use it for static select menus.
metadata:
  package: '@samline/autocomplete'
  package-version: '1.0.0'
---

# @samline/autocomplete

Build against the installed `@samline/autocomplete` version. This skill describes **1.0.0**. Check the dependency version before applying it, and preserve the host project's markup, components and design.

## The one contract

```js
import { createAutocomplete } from '@samline/autocomplete'
import '@samline/autocomplete/styles.css'

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

- **Package / ESM:** `npm install @samline/autocomplete`, import `createAutocomplete` (ESM or CommonJS) and optionally `@samline/autocomplete/styles.css`.
- **HTML / CDN:** load `https://cdn.jsdelivr.net/npm/@samline/autocomplete@1.0.0/dist/styles.css` and `.../dist/browser/global.global.js`, then `window.Autocomplete.create('#id', options)`. `create` requires an input id; `window.Autocomplete.destroy(id)` removes it.

## Adapt the endpoint

- `endpoint` is a URL or `(query, input) => URL`; set `queryParam: null` when the function builds the whole URL.
- `requestInit` adds headers or credentials; `parseResponse` replaces `response.json()`.
- `mapResponse(payload, response, query)` must return an array; `getId`, `getLabel` and `getValue` read your item shape.
- `minLength` (2), `debounce` (250), `maxResults` (8), `searchOnFocus` (true) and `messages` tune the behavior.

## Keep the form in sync

Listen to bubbling events on the input: `autocomplete:select` (`{ suggestion, label, value }`), `autocomplete:clear`, `autocomplete:load`, `autocomplete:loadstart` and `autocomplete:error`. Store ids in a hidden field on select and empty it on clear.

## Do not

- Do not add your own debounce, AbortController or keyboard handling: the package owns them, and closing the list already cancels pending work.
- Do not inject HTML strings from suggestions; use `renderOption(option, item)` and append elements.
- Do not create a second controller for the same input; destroy the old one first.
