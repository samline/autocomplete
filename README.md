# @samline/autocomplete

An accessible, framework-agnostic remote autocomplete (combobox) for vanilla JavaScript, TypeScript and plain HTML. Point an input at your endpoint; debounce, cancellation, keyboard navigation, events and cleanup are handled for you.

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

- Turns the existing input into an ARIA combobox and renders a listbox right after it.
- Searches once the query reaches two characters, 250 ms after typing stops.
- Reads a root array, or a `suggestions`, `items` or `data` array, from the JSON response.
- Writes the chosen suggestion into the input, dispatches `autocomplete:select` and calls `onSelect`.
- Restores the input attributes it changed and removes the list when `destroy()` runs.

The wrapper needs `position: relative` because the default list is absolutely positioned under the input.

## HTML / CDN

Choose **Package / ESM** when installing with npm, pnpm or bun and importing Autocomplete in your application. Choose **HTML / CDN** for Shopify, WordPress or plain HTML pages without a build step. Both use the same options and controller.

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@samline/autocomplete@1.0.0/dist/styles.css"
/>
<script src="https://cdn.jsdelivr.net/npm/@samline/autocomplete@1.0.0/dist/browser/global.global.js"></script>
```

> Pin the version in production, or self-host the same files.

The standalone script (an IIFE) defines `window.Autocomplete`:

```html
<div class="field" style="position: relative">
  <label for="city">City</label>
  <input id="city" type="text" />
</div>

<script>
  const city = window.Autocomplete.create('#city', { endpoint: '/api/cities' })
</script>
```

`create(target, options)` requires an input with an `id` and stores the controller in `Autocomplete.available[id]`; `destroy(id)` removes it. `autocomplete(target, options)` creates a controller without the registry.

## Capabilities

- Remote search on any URL, `URL` object or function of the query.
- Any response shape through `parseResponse`, `mapResponse`, `getId`, `getLabel` and `getValue`.
- WAI-ARIA combobox and listbox with full keyboard operation and announced states.
- Debounced searches, aborted superseded requests and ignored late responses.
- Bubbling DOM events that keep hidden fields and other UI in sync.
- An optional stylesheet themed with `--autocomplete-*` custom properties.
- React, Vue, Svelte, Shopify and WordPress through the same API, with no adapter.

[Working examples](https://samline.github.io/autocomplete/examples/) cover remote search, custom options and events, each with copyable files.

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

### An accessible combobox

ARIA `combobox` and `listbox` roles, `aria-expanded` and `aria-activedescendant`, status and error messages, and ArrowUp, ArrowDown, Home, End, Enter, Escape and Tab. Searches wait for IME composition to finish. Option content is set with `textContent`; `renderOption` appends your own DOM nodes, never HTML strings.

### No stale results

Searches are debounced, superseded requests are aborted and late responses ignored. Closing the list (Escape, Tab, clicking outside, selecting or `close()`) cancels the pending search.

## API at a glance

| API                                      | Purpose                                                |
| ---------------------------------------- | ------------------------------------------------------ |
| `createAutocomplete(input, options)`     | Controller factory (`autocomplete` is an alias).       |
| `search(query?)`, `close()`, `cancel()`  | Run a search now, close the list, cancel pending work. |
| `clear()`, `getSelected()`               | Clear input and selection, or read the selected item.  |
| `destroy()`                              | Cleanup.                                               |
| `mapCommonResponse`, `parseJsonResponse` | The default response mapper and parser.                |
| `browser`                                | Importable equivalent of `window.Autocomplete`.        |

The controller also exposes `element` (the input), `listElement` (the listbox) and `options`.

### Entrypoints

| Entrypoint                         | When to use                                                     |
| ---------------------------------- | --------------------------------------------------------------- |
| `@samline/autocomplete`            | ESM or CommonJS: factories, helpers, `browser` registry, types. |
| `@samline/autocomplete/browser`    | Standalone script (IIFE) that defines `window.Autocomplete`.    |
| `@samline/autocomplete/styles.css` | Optional base stylesheet.                                       |

### Events

All events bubble from the input.

| Event                    | `detail`                       |
| ------------------------ | ------------------------------ |
| `autocomplete:loadstart` | `{ query }`                    |
| `autocomplete:load`      | `{ query, suggestions }`       |
| `autocomplete:error`     | `{ query, error }`             |
| `autocomplete:select`    | `{ suggestion, label, value }` |
| `autocomplete:clear`     | `{ query }`                    |

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
- With the browser global, `create()` on an id that is already registered destroys the previous controller first.

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
