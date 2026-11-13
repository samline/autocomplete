# Getting started

`@samline/autocomplete` turns an existing text input into an accessible remote combobox. The consumer owns the endpoint and response contract; the package owns debounce, cancellation, request ordering, rendering, keyboard interaction, and cleanup.

```bash
bun add @samline/autocomplete
```

```ts
import { createAutocomplete } from '@samline/autocomplete'
import '@samline/autocomplete/styles.css'

const search = createAutocomplete('#search', {
  endpoint: '/api/search',
  mapResponse: (payload) => payload.results,
  getLabel: (result) => result.name,
  getValue: (result) => result.name
})
```

Call `search.destroy()` when the input is unmounted by a drawer, route, island, or client component.

## Runtime flow

1. An `input` event starts the configured debounce.
2. The package adds the query to the endpoint and starts `fetch`.
3. A newer query aborts and invalidates the older request.
4. `mapResponse` extracts an array from the response.
5. Label/value/id adapters translate each item for the listbox.
6. Pointer or keyboard selection writes the value and emits `autocomplete:select`.

The root import has no DOM side effect. DOM is touched only when `createAutocomplete` is called.
