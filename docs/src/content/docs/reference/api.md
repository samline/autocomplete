---
locale: en
sidebar:
  group: reference
  order: 2
title: 'API reference'
titleAccent: 'reference'
description: 'createAutocomplete, the controller members, the source, cache, filtering and highlighting helpers, the browser registry and every event with its detail.'
---

## `createAutocomplete(target, options)`

`target` is an `HTMLInputElement` or a selector. Returns an `AutocompleteController<T>`. `autocomplete` is an alias. Throws a `TypeError` when the target is not an input, when not exactly one of `source`, `endpoint` and `sections` is given, or when an option is invalid.

## Controller

| Member           | Description                                                        |
| ---------------- | ------------------------------------------------------------------ |
| `element`        | The managed input.                                                 |
| `popupElement`   | The positioned container inserted after the input.                 |
| `listElement`    | The generated listbox inside the popup.                            |
| `statusElement`  | The visible loading, empty or error message inside the popup.      |
| `liveElement`    | The visually hidden polite live region after the popup.            |
| `hiddenElement`  | The synced hidden input, or `null` without `hiddenInput`.          |
| `recent`         | The recent selections store, or `null` without `recent`.           |
| `options`        | The options object you passed.                                     |
| `search(query?)` | Runs a search now, without debounce.                               |
| `close()`        | Closes the list and cancels the pending or in-flight search.       |
| `clear()`        | Clears the input, selection, results and pending work.             |
| `cancel()`       | Cancels the debounce timer and aborts the active request.          |
| `clearCache()`   | Forgets every cached query.                                        |
| `getSelected()`  | The original selected suggestion, or `null`.                       |
| `destroy()`      | Cancels work, removes listeners and elements, restores attributes. |

## Helpers

All helpers are exported from `@samline/autocomplete`; the DOM-free ones also from `@samline/autocomplete/core`.

- `fromEndpoint({ endpoint, queryParam?, requestInit?, parseResponse?, mapResponse? })`: returns the `(query, { signal, input })` source function used for `endpoint`. Reuse or wrap it in your own `source`.
- `filterSuggestions(items, query, { getText, normalize? })`: keeps the items whose text contains every word of the query. The default filter for array sources.
- `normalizeText(text)`: lowercases and removes diacritics.
- `highlight(text, query, normalize?)`: returns `{ text, match }[]` parts that keep the original characters.
- `renderHighlight(element, parts)`: appends parts as text nodes and `<mark data-autocomplete-highlight>` elements (from `@samline/autocomplete/vanilla`).
- `createCache({ max?, ttl? })`: the LRU cache with `get`, `set`, `clear` and `size`.
- `createRecentStore({ key?, max?, getKey?, storage? })`: a most-recent-first list with `get`, `add`, `remove` and `clear`, stored as JSON in `localStorage` (or the `storage` you pass) and in memory as a fallback.
- `mapCommonResponse(payload)`: reads a root array or `suggestions`, `items` or `data` arrays.
- `parseJsonResponse(response)`: the default JSON parser.
- `DEFAULT_MESSAGES`: the English messages.

## Browser registry

The CDN bundle (`@samline/autocomplete/browser/global`) defines `window.Autocomplete`. The same object is importable as `Autocomplete` (alias `browser`) from `@samline/autocomplete` or `@samline/autocomplete/browser`.

| Member                             | Description                                                                  |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| `newAutocomplete({ id, options })` | Enhances the input with that id and registers it; returns `null` if missing. |
| `getAutocomplete(id)`              | The registered controller, or `null`.                                        |
| `getAutocompletes()`               | A copy of the registered controllers by id.                                  |
| `destroyAutocomplete(idOrInput)`   | Destroys and unregisters one controller.                                     |
| `destroyAutocompletes()`           | Destroys and unregisters every controller.                                   |
| `available`                        | The live registry object.                                                    |
| `autocomplete(target, options)`    | Creates a controller without registering it.                                 |

Registering an id again destroys the previous controller. Calling `destroy()` on a registered controller also unregisters it.

## Events

All events bubble from the input.

| Event                    | `detail`                                   |
| ------------------------ | ------------------------------------------ |
| `autocomplete:loadstart` | `{ query }`                                |
| `autocomplete:load`      | `{ query, suggestions, sections, cached }` |
| `autocomplete:error`     | `{ query, error, section }`                |
| `autocomplete:select`    | `{ suggestion, label, value, section }`    |
| `autocomplete:clear`     | `{ query }`                                |

`autocomplete:loadstart` fires only when a source is called; array sources and cache hits go straight to `autocomplete:load`. `sections` lists `{ id, label?, suggestions }` in order; a single source reports one entry with the id `default`. `section` is the section id, `recent` for a recent selection, or `null` for a single source.

## Types

`AutocompleteOptions<T>`, `AutocompleteController<T>`, `AutocompleteTarget`, `AutocompleteSource<T>`, `AutocompleteSourceFunction<T>`, `AutocompleteSourceContext`, `AutocompleteEndpoint`, `AutocompleteEndpointOptions<T>`, `AutocompleteRequestInit`, `AutocompleteParser`, `AutocompleteResponseMapper<T>`, `AutocompleteCacheOptions`, `AutocompleteCache<T>`, `AutocompleteSection<T>`, `AutocompleteSectionResult<T>`, `AutocompleteRecentOptions<T>`, `AutocompleteRecentStore<T>`, `AutocompleteStorage`, `CreateRecentStoreOptions<T>`, `AutocompleteHiddenInputOptions<T>`, `AutocompletePlacement`, `AutocompleteStatusState`, `AutocompleteStatusContext`, `AutocompleteResultsContext<T>`, `AutocompleteMessages`, `AutocompleteMessage`, `AutocompleteMessageContext`, `AutocompleteHighlightPart`, `AutocompleteRenderContext`, `AutocompleteNormalizer`, `FilterSuggestionsOptions<T>`, `AutocompleteSelectDetail<T>`, `AutocompleteLoadDetail<T>`, `AutocompleteErrorDetail`, `AutocompleteApi`, `AutocompleteAvailable` and `NewAutocompleteInput<T>`.
