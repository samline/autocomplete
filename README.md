# @samline/autocomplete

An accessible, framework-agnostic autocomplete (combobox) for vanilla JavaScript, TypeScript and plain HTML. Point an input at an endpoint, an async function or a local array; debounce, cancellation, caching, accent-insensitive matching, highlighting, keyboard navigation, screen reader announcements, events and cleanup are handled for you.

[Demo](https://samline.github.io/autocomplete/) · [Examples](https://samline.github.io/autocomplete/examples/) · [Documentation](https://samline.github.io/autocomplete/docs/) · [Changelog](CHANGELOG.md)

## Table of contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [HTML / CDN](#html--cdn)
- [Capabilities](#capabilities)
- [API at a glance](#api-at-a-glance)
- [Documentation](#documentation)
- [Changelog](#changelog)
- [AI agent skill](#ai-agent-skill)
- [License](#license)

## Installation

```sh
npm install @samline/autocomplete
```

```sh
pnpm add @samline/autocomplete
```

```sh
bun add @samline/autocomplete
```

Requires Node 20+ when bundling. Runs in modern browsers with `fetch` and `AbortController`. No runtime dependencies.

Import the optional stylesheet once in your application entrypoint:

```js
import '@samline/autocomplete/styles.css'
```

## Quick start

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
  endpoint: '/api/cities', // GET /api/cities?q=<query>
  getId: city => city.id,
  getLabel: city => city.name,
  onSelect: city => console.log('Selected', city),
})

// When the owning component or page leaves:
controller.destroy()
```

What this does:

- Turns the existing input into an ARIA combobox and renders a popup with a listbox right after it.
- Searches once the query reaches two characters, 250 ms after typing stops, and caches each query's results for five minutes.
- Reads a root array, or a `suggestions`, `items` or `data` array, from the JSON response.
- Highlights the typed words in each label and announces the result count to screen readers.
- Writes the chosen suggestion into the input, dispatches `autocomplete:select` and calls `onSelect`.
- Restores the input attributes it changed and removes the list when `destroy()` runs.

The wrapper needs `position: relative` because the default popup is absolutely positioned under the input.

## HTML / CDN

Choose **Package / ESM** when installing with npm, pnpm or bun and importing Autocomplete in your application. Choose **HTML / CDN** for Shopify, WordPress or plain HTML pages without a build step. Both use the same options and controller.

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@samline/autocomplete@2.1.0/dist/styles.css"
/>
<script src="https://cdn.jsdelivr.net/npm/@samline/autocomplete@2.1.0/dist/browser/global.global.js"></script>
```

> Pin the version in production, or self-host the same files.

The standalone script (an IIFE) defines `window.Autocomplete`:

```html
<div class="field" style="position: relative">
  <label for="city">City</label>
  <input id="city" type="text" />
</div>

<script>
  const city = window.Autocomplete.newAutocomplete({
    id: 'city',
    options: { endpoint: '/api/cities' },
  })
</script>
```

The global follows the same registry shape as the other `@samline` packages:

| Member                                   | Purpose                                                            |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `newAutocomplete({ id, options })`       | Enhances the input with that id; replaces a previous registration. |
| `getAutocomplete(id)`                    | The registered controller, or `null`.                              |
| `getAutocompletes()`                     | A copy of every registered controller by id.                       |
| `destroyAutocomplete(idOrInput)`         | Destroys one registered controller.                                |
| `destroyAutocompletes()`                 | Destroys them all.                                                 |
| `available`, `autocomplete(input, opts)` | The live registry, and a factory that bypasses it.                 |

`newAutocomplete` logs and returns `null` when the id is empty or no input has it.

## Capabilities

- Three kinds of source: an HTTP endpoint, an async function (SDKs, GraphQL, workers) or a local array.
- Any response shape through `parseResponse`, `mapResponse`, `getId`, `getLabel` and `getValue`.
- Accent- and case-insensitive matching: `merida` finds `Mérida`.
- Highlighted matches rendered as `<mark>` elements, never HTML strings.
- A per-query LRU cache with expiry for function and endpoint sources.
- Labelled sections that search several sources in parallel.
- Recent selections shown on an empty input, stored in `localStorage`.
- A hidden form field that holds the selected id.
- Placement that flips above when there is no room, and an optional top-layer popup through the Popover API.
- Custom status, header and footer content.
- WAI-ARIA combobox and listbox with full keyboard operation and a polite live region.
- Debounced searches, aborted superseded requests and ignored late responses.
- Bubbling DOM events that keep hidden fields and other UI in sync.
- An optional stylesheet themed with `--autocomplete-*` custom properties.
- React, Vue, Svelte, Shopify and WordPress through the same API, with no adapter.

[Working examples](https://samline.github.io/autocomplete/examples/) cover remote search, custom options, events, local data, sections and forms, each with copyable files.

### Any source

Pass exactly one of `source`, `endpoint` or `sections`.

```js
// A local array, filtered in the browser (minLength 1, no debounce by default).
createAutocomplete('#state', { source: ['Michoacán', 'Nuevo León', 'Querétaro'] })

// Any async function. Pass the signal on so dismissed searches abort.
createAutocomplete('#user', {
  source: (query, { signal }) => api.users.search(query, { signal }),
  getLabel: user => user.name,
})
```

`filter(item, query)` replaces the local match, and `normalize(text)` replaces the accent- and case-insensitive comparison used by the filter and the highlighting.

### Any endpoint, any response

`endpoint` is a URL or a function of the query. `queryParam` names the query-string key (`q` by default; `null` when the function builds the complete URL). `requestInit` adds headers or credentials, `parseResponse` replaces JSON parsing, and `mapResponse` returns the suggestion array.

```js
createAutocomplete('#city', {
  endpoint: query => `/api/search?term=${encodeURIComponent(query)}`,
  queryParam: null,
  requestInit: { headers: { Authorization: `Bearer ${token}` } },
  mapResponse: payload => payload.data.items,
  getLabel: item => item.title,
})
```

### Sections

`sections` searches several sources in parallel and renders each under a `role="group"` heading. Arrow keys move through every option; events carry the section id.

```js
import { createAutocomplete, fromEndpoint } from '@samline/autocomplete'

createAutocomplete('#search', {
  sections: [
    { id: 'pages', label: 'Pages', source: ['Pricing', 'Docs', 'Blog'] },
    { id: 'users', label: 'People', source: (query, { signal }) => api.users(query, { signal }) },
    {
      id: 'products',
      label: 'Products',
      source: fromEndpoint({ endpoint: '/api/products' }),
      maxResults: 4,
    },
  ],
})
```

A failing section is dropped and reported through `autocomplete:error`; the error state appears only when every pending section fails and nothing else matched.

### Recent selections and forms

```html
<form>
  <label for="city">City</label>
  <input id="city" type="text" />
</form>
```

```js
createAutocomplete('#city', {
  endpoint: '/api/cities',
  getId: city => city.id,
  recent: { label: 'Recent', max: 5 }, // shown on focus or ArrowDown while empty
  hiddenInput: 'city_id', // <input type="hidden" name="city_id"> holds the id
})
```

Recent selections are stored as JSON in `localStorage` under `autocomplete:recent:<input id>` and fall back to memory. Pass `recent: { store: createRecentStore({ ... }) }` to control storage. The hidden input empties when the text changes and dispatches `change`; pass `{ element: '#existing', getValue }` to fill a field you already have.

### Placement and the top layer

The popup opens below the input and flips above when there is no room (`placement: 'auto' | 'bottom' | 'top'`). Inside cards with `overflow: hidden` or tricky stacking contexts, `popover: true` renders it in the top layer with the Popover API and keeps it pinned to the input on scroll and resize.

### Status, header and footer

```js
createAutocomplete('#city', {
  endpoint: '/api/cities',
  renderStatus: (element, { state, query }) => {
    if (state === 'empty') element.textContent = `Nothing for “${query}”. Try another spelling.`
  },
  renderFooter: (element, { query, count }) => {
    const link = document.createElement('a')
    link.href = `/search?q=${encodeURIComponent(query)}`
    link.textContent = `See all results (${count} shown)`
    element.append(link)
  },
})
```

Header and footer content sits outside the listbox and is not reached with the arrow keys.

### Caching

Function and endpoint results are cached per query: up to 50 queries for five minutes, least recently used first out. Failures are never cached.

```js
createAutocomplete('#city', { endpoint: '/api/cities', cache: { max: 100, ttl: 60_000 } })
createAutocomplete('#stock', { endpoint: '/api/stock', cache: false })
```

Call `controller.clearCache()` after the data changes. `autocomplete:load` reports `cached: true` for cache hits.

### Highlighting and custom options

Each label is split into matching and non-matching parts and rendered with `<mark data-autocomplete-highlight>`; set `highlight: false` to render plain text. `renderOption(element, item, context)` receives `{ query, index, label, highlight }` to append your own DOM nodes, never HTML strings.

```js
import { createAutocomplete, renderHighlight } from '@samline/autocomplete'

createAutocomplete('#city', {
  endpoint: '/api/cities',
  renderOption: (option, city, { highlight }) => {
    option.replaceChildren()
    const name = document.createElement('strong')
    renderHighlight(name, highlight)
    const country = document.createElement('small')
    country.textContent = city.country
    option.append(name, country)
  },
})
```

`highlight(text, query)`, `filterSuggestions(items, query, { getText })` and `normalizeText(text)` are exported for your own rendering and filtering.

### An accessible combobox

ARIA `combobox` and `listbox` roles, `aria-expanded`, `aria-activedescendant` and a labelled listbox, and ArrowUp, ArrowDown, Home, End, Enter, Escape and Tab. Options are non-focusable `role="option"` elements. Loading, empty and error states are shown outside the listbox, and results, empty and error messages are announced through a polite live region. Searches wait for IME composition to finish.

Every message is a string or a function of `{ query, count }`:

```js
createAutocomplete('#ciudad', {
  endpoint: '/api/ciudades',
  messages: {
    loading: 'Buscando…',
    empty: ({ query }) => `Sin resultados para «${query}»`,
    error: 'La búsqueda falló',
    results: ({ count }) => (count === 1 ? '1 resultado' : `${count} resultados`),
  },
})
```

### No stale results

Searches are debounced, superseded requests are aborted and late responses ignored. Closing the list (Escape, Tab, clicking outside, selecting or `close()`) cancels the pending search.

## API at a glance

| API                                                    | Purpose                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------ |
| `createAutocomplete(input, options)`                   | Controller factory (`autocomplete` is an alias).             |
| `search(query?)`, `close()`, `cancel()`                | Run a search now, close the list, cancel pending work.       |
| `clear()`, `getSelected()`                             | Clear input and selection, or read the selected item.        |
| `clearCache()`                                         | Forget cached results.                                       |
| `destroy()`                                            | Cleanup.                                                     |
| `fromEndpoint(options)`                                | Build a reusable endpoint source function.                   |
| `highlight`, `renderHighlight`                         | Split a label into matches, and render the parts.            |
| `filterSuggestions`, `normalizeText`                   | The default local filter and text normalizer.                |
| `createCache(options?)`, `createRecentStore(options?)` | The per-instance LRU cache, and the recent selections store. |
| `mapCommonResponse`, `parseJsonResponse`               | The default response mapper and parser.                      |
| `Autocomplete`, `browser`                              | Importable equivalent of `window.Autocomplete`.              |

The controller also exposes `element` (the input), `popupElement`, `listElement` (the listbox), `statusElement`, `liveElement`, `hiddenElement`, `recent` and `options`.

### Entrypoints

| Entrypoint                             | When to use                                                   |
| -------------------------------------- | ------------------------------------------------------------- |
| `@samline/autocomplete`                | ESM or CommonJS: everything below, side-effect free.          |
| `@samline/autocomplete/core`           | DOM-free helpers: sources, cache, filtering, highlighting.    |
| `@samline/autocomplete/vanilla`        | The DOM factory and `renderHighlight`.                        |
| `@samline/autocomplete/browser`        | The registry as a module (`Autocomplete`, `newAutocomplete`). |
| `@samline/autocomplete/browser/global` | Standalone script (IIFE) that defines `window.Autocomplete`.  |
| `@samline/autocomplete/styles.css`     | Optional base stylesheet (also `style.css`).                  |

### Events

All events bubble from the input.

| Event                    | `detail`                                   |
| ------------------------ | ------------------------------------------ |
| `autocomplete:loadstart` | `{ query }`                                |
| `autocomplete:load`      | `{ query, suggestions, sections, cached }` |
| `autocomplete:error`     | `{ query, error, section }`                |
| `autocomplete:select`    | `{ suggestion, label, value, section }`    |
| `autocomplete:clear`     | `{ query }`                                |

```js
const input = document.querySelector('#city')
const hidden = document.querySelector('#city-id')

input.addEventListener('autocomplete:select', event => {
  hidden.value = event.detail.suggestion.id
})
input.addEventListener('autocomplete:clear', () => (hidden.value = ''))
```

### One lifecycle

- Each `createAutocomplete()` call owns one input. Keep the returned controller.
- `close()` and `cancel()` keep the controller usable; `clear()` also empties the input and dispatches `autocomplete:clear` when something was selected.
- `destroy()` aborts pending work, removes the list and listeners, and restores the input attributes. Repeated calls are harmless.
- With the registry, `newAutocomplete()` on an id that is already registered destroys the previous controller first, and a direct `destroy()` also unregisters it.

### TypeScript

The package includes declarations. Pass your suggestion type to `createAutocomplete<T>()` to type `getLabel`, `onSelect`, `renderOption` and `getSelected()`. `AutocompleteOptions<T>`, `AutocompleteController<T>` and the event detail types are exported; see the [API reference](https://samline.github.io/autocomplete/docs/reference/api/#types).

## Documentation

Read the [documentation](https://samline.github.io/autocomplete/docs/) for the full guides and API contracts, and explore [working examples](https://samline.github.io/autocomplete/examples/) with complete and separate source files.

| Guide                                                                              | What it covers                                           |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [Installation](https://samline.github.io/autocomplete/docs/getting-started/)       | Package / ESM, HTML / CDN, frameworks and starter files. |
| [Examples](https://samline.github.io/autocomplete/docs/guides/examples/)           | Live previews with their complete, copyable source.      |
| [Options](https://samline.github.io/autocomplete/docs/reference/configuration/)    | Every option and its default.                            |
| [API reference](https://samline.github.io/autocomplete/docs/reference/api/)        | The controller, helpers, browser global, events, types.  |
| [Accessibility](https://samline.github.io/autocomplete/docs/guides/accessibility/) | What the combobox provides and what your page provides.  |
| [Styling](https://samline.github.io/autocomplete/docs/guides/styling/)             | The DOM contract and the custom properties.              |

## Changelog

Read [CHANGELOG.md](CHANGELOG.md) or the [published changelog](https://samline.github.io/autocomplete/docs/changelog/) for release history and explicitly marked breaking and behavior changes. Review the notes before upgrading.

## AI agent skill

The [Autocomplete skill](https://samline.github.io/autocomplete/skills/autocomplete/SKILL.md) teaches verified package integration. Its maintained [repository source](skills/autocomplete/SKILL.md) and website download are the same file. Verify the installed package version before applying its guidance.

Download [SKILL.md](https://samline.github.io/autocomplete/skills/autocomplete/SKILL.md) into an `autocomplete/` folder in your agent's supported skill directory. For agents that discover project skills from `.agents/skills/`:

```sh
mkdir -p .agents/skills/autocomplete
curl --fail --location https://samline.github.io/autocomplete/skills/autocomplete/SKILL.md \
  --output .agents/skills/autocomplete/SKILL.md
```

When working from this repository, copy `skills/autocomplete/SKILL.md` instead. Keep the filename `SKILL.md`; discovery paths and invocation syntax depend on the agent.

## License

MIT — [LICENSE.md](LICENSE.md).
