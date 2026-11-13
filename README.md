# Autocomplete

> A small, framework- and provider-agnostic remote autocomplete for Vanilla JS and direct browser usage.

The consumer defines the endpoint, request options, response mapping, and suggestion labels. The package provides debounce, abortable requests, stale-response protection, accessible listbox rendering, pointer/keyboard selection, events, and cleanup.

## Installation

```bash
npm install @samline/autocomplete
# or
bun add @samline/autocomplete
```

Requires Node 20+ when bundling. Runtime target is ES2020.

## Quick start

```ts
import { createAutocomplete } from '@samline/autocomplete'
import '@samline/autocomplete/styles.css'

const controller = createAutocomplete('#address', {
  endpoint: '/api/addresses',
  queryParam: 'search',
  mapResponse: (payload) => payload.results,
  getId: (address) => address.key,
  getLabel: (address) => address.description,
  getValue: (address) => address.description,
  onSelect(address) {
    console.log(address)
  }
})
```

No response shape is built into the package. The default mapper only recognizes a root array and the common root properties `suggestions`, `items`, or `data`.

## Browser / CDN

```html
<link rel="stylesheet" href="https://unpkg.com/@samline/autocomplete@0.1.0/dist/styles.css" />
<input id="search" />
<script src="https://unpkg.com/@samline/autocomplete@0.1.0/dist/browser/global.global.js"></script>
<script>
  window.Autocomplete.create('#search', { endpoint: '/api/search' })
</script>
```

Pin the version in production. The browser entrypoint exposes `window.Autocomplete` with `autocomplete`, `create`, `destroy`, and `available`.

## Entrypoints

| Entrypoint                         | Use                                             |
| ---------------------------------- | ----------------------------------------------- |
| `@samline/autocomplete`            | ESM/CJS factory, helpers, and TypeScript types. |
| `@samline/autocomplete/browser`    | IIFE exposing `window.Autocomplete`.            |
| `@samline/autocomplete/styles.css` | Optional base stylesheet.                       |

## Features

- Configurable endpoint or endpoint resolver.
- Configurable query parameter, `RequestInit`, parser, and response mapper.
- Generic TypeScript suggestion type.
- Debounce and `AbortController` cancellation.
- Sequence guard against stale responses.
- Loading, empty, and error states.
- `ArrowUp`, `ArrowDown`, `Home`, `End`, `Enter`, `Escape`, and `Tab` support. Closing the list (`Escape`, `Tab`, clicking outside, a selection or `close()`) also cancels the pending search and aborts the request in flight, so a late response never reopens it.
- Waits for IME composition (Japanese, Chinese, Korean input) to finish before searching.
- WAI-ARIA combobox/listbox attributes.
- Pointer selection and outside-click dismissal.
- Bubbling lifecycle events.
- Attribute restoration and complete `destroy()` cleanup.
- No framework, provider, or runtime dependency.
- No HTML injection from endpoint content.

## Controller

`createAutocomplete` returns `AutocompleteController<T>`:

```ts
controller.search('mex')
controller.close()
controller.clear()
controller.cancel()
controller.getSelected()
controller.destroy()
```

## Documentation

| Guide                                                      | Purpose                                              |
| ---------------------------------------------------------- | ---------------------------------------------------- |
| [`docs/getting-started.md`](docs/getting-started.md)       | Runtime model and first integration.                 |
| [`docs/options.md`](docs/options.md)                       | Complete options reference.                          |
| [`docs/api/index.md`](docs/api/index.md)                   | Factory, controller, helpers, and events.            |
| [`docs/browser.md`](docs/browser.md)                       | `window.Autocomplete` usage.                         |
| [`docs/css-styling.md`](docs/css-styling.md)               | Data attributes and CSS variables.                   |
| [`docs/typescript.md`](docs/typescript.md)                 | Generic types and typed events.                      |
| [`docs/recipes.md`](docs/recipes.md)                       | Auth, endpoint resolvers, Next.js, custom parsers.   |

## Development

```bash
bun install
bun run build
bun run typecheck
bun run test
bun run format:check
npm pack --dry-run
```

## License

MIT
