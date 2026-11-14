---
locale: en
sidebar:
  group: reference
  order: 2
title: 'API reference'
titleAccent: 'reference'
description: 'createAutocomplete, the controller, state and plugins, the headless search and helpers, the registry, declarative mount and every event.'
---

## `createAutocomplete(target, options)`

`target` is an `HTMLInputElement` or a selector. Returns an `AutocompleteController<T>`. `autocomplete` is an alias. Throws a `TypeError` when the target is not an input, when not exactly one of `source`, `endpoint` and `sections` is given, or when an option is invalid.

## Controller

| Member           | Description                                                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `element`        | The managed input.                                                                                                      |
| `popupElement`   | The positioned container inserted after the input.                                                                      |
| `listElement`    | The generated listbox inside the popup.                                                                                 |
| `statusElement`  | The visible loading, empty or error message inside the popup.                                                           |
| `liveElement`    | The visually hidden polite live region after the popup.                                                                 |
| `hiddenElement`  | The synced hidden input, or `null` without `hiddenInput`.                                                               |
| `recent`         | The recent selections store, or `null` without `recent`.                                                                |
| `options`        | The options object you passed.                                                                                          |
| `search(query?)` | Runs a search now, without debounce.                                                                                    |
| `close()`        | Closes the list and cancels the pending or in-flight search.                                                            |
| `clear()`        | Clears the input, selection, results and pending work.                                                                  |
| `cancel()`       | Cancels the debounce timer and aborts the active request.                                                               |
| `clearCache()`   | Forgets every cached query.                                                                                             |
| `getSelected()`  | The original selected suggestion, or `null`.                                                                            |
| `setValue(item)` | Selects `item` (or `null`) without events: input text, hidden input and state. For edit forms.                          |
| `getState()`     | The current `AutocompleteState` snapshot.                                                                               |
| `subscribe(fn)`  | Calls `fn(state)` on every state change; returns an unsubscribe function.                                               |
| `on(event, fn)`  | Listens to `loadstart`, `load`, `error`, `select`, `clear`, `open` or `close` details; returns an unsubscribe function. |
| `destroy()`      | Cancels work, removes listeners and elements, restores attributes.                                                      |

## State

`getState()` and `subscribe()` describe what the controller shows, for framework bindings and custom UI around it:

| Field         | Description                                                                    |
| ------------- | ------------------------------------------------------------------------------ |
| `query`       | The query of the last search (after `beforeSearch`), or `''` for recent items. |
| `status`      | `idle`, `loading`, `results`, `empty`, `error` or `recent`.                    |
| `open`        | Whether the popup is visible.                                                  |
| `suggestions` | Rendered suggestions in keyboard order.                                        |
| `sections`    | `{ id, label?, suggestions }[]` as rendered.                                   |
| `activeIndex` | The highlighted option, or `-1`.                                               |
| `selected`    | The selected suggestion, or `null`.                                            |

Snapshots are immutable: a new object is published only when a field changes.

## Plugins

A plugin is `{ name, setup(controller) }`. `setup` runs once the controller exists and may return `{ beforeSearch?, transformSuggestions?, beforeSelect?, destroy? }`. Hooks from the options run first, then each plugin in order; `destroy` runs with `controller.destroy()`.

## Helpers

All helpers are exported from `@samline/autocomplete`; the DOM-free ones also from `@samline/autocomplete/core`.

- `createSearch(options)`: the DOM-free pipeline behind the controller. Takes the source, sections, cache, filter, normalize, getLabel, maxResults and transformSuggestions options and returns `{ run(query, { signal, input }), clearCache(), sections, local }`. `run` returns the result synchronously for local arrays and cache hits and a promise otherwise; results carry `sections`, `count`, `cached`, `errors`, `failed` and `aborted`.
- `optionsFromDataset(input)`: reads options from the input's `data-autocomplete*` attributes.
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

| Member                                      | Description                                                                  |
| ------------------------------------------- | ---------------------------------------------------------------------------- |
| `newAutocomplete({ id, options })`          | Enhances the input with that id and registers it; returns `null` if missing. |
| `getAutocomplete(id)`                       | The registered controller, or `null`.                                        |
| `getAutocompletes()`                        | A copy of the registered controllers by id.                                  |
| `destroyAutocomplete(idOrInput)`            | Destroys and unregisters one controller.                                     |
| `destroyAutocompletes()`                    | Destroys and unregisters every controller.                                   |
| `available`                                 | The live registry object.                                                    |
| `mount`, `unmount`, `refresh`, `getMounted` | The declarative mount; see above.                                            |
| `autocomplete(target, options)`             | Creates a controller without registering it.                                 |

Registering an id again destroys the previous controller. Calling `destroy()` on a registered controller also unregisters it.

## Declarative mount

| Function              | Description                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `mount({ defaults })` | Enhances every `input[data-autocomplete]` now and as inputs are added; destroys removed ones. |
| `refresh()`           | Re-scans the document.                                                                        |
| `unmount()`           | Stops observing and destroys every mounted controller.                                        |
| `getMounted()`        | A `Map` of mounted inputs to controllers.                                                     |

The standalone script calls `mount()` on load. Mounted inputs with an id are added to the registry, so `getAutocomplete(id)` returns them. Invalid attributes log an error and leave the input untouched.

| Attribute                                                               | Option                                                                          |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `data-autocomplete="/url"`                                              | `endpoint` (the bare attribute marks the input)                                 |
| `data-autocomplete-source`                                              | `source`: a JSON array, or the selector of a `<script type="application/json">` |
| `data-autocomplete-min-length`, `-debounce`, `-max-results`, `-offset`  | numbers                                                                         |
| `data-autocomplete-query-param`                                         | `queryParam`; empty for `null`                                                  |
| `data-autocomplete-placement`                                           | `placement`                                                                     |
| `data-autocomplete-popover`, `-highlight`, `-cache`, `-search-on-focus` | booleans; present or `"true"`, or `"false"`                                     |
| `data-autocomplete-hidden-input`                                        | `hiddenInput` name                                                              |
| `data-autocomplete-recent`, `-recent-label`                             | `recent`                                                                        |
| `data-autocomplete-label-key`, `-value-key`, `-id-key`                  | field names for `getLabel`, `getValue` (defaults to the label key), `getId`     |
| `data-autocomplete-loading`, `-empty`, `-error`                         | `messages`                                                                      |

## Events

All events bubble from the input.

| Event                    | `detail`                                   |
| ------------------------ | ------------------------------------------ |
| `autocomplete:loadstart` | `{ query }`                                |
| `autocomplete:load`      | `{ query, suggestions, sections, cached }` |
| `autocomplete:error`     | `{ query, error, section }`                |
| `autocomplete:select`    | `{ suggestion, label, value, section }`    |
| `autocomplete:clear`     | `{ query }`                                |
| `autocomplete:open`      | `{ query }`                                |
| `autocomplete:close`     | `{ query }`                                |

`autocomplete:loadstart` fires only when a source is called; array sources and cache hits go straight to `autocomplete:load`. `sections` lists `{ id, label?, suggestions }` in order; a single source reports one entry with the id `default`. `section` is the section id, `recent` for a recent selection, or `null` for a single source.

## Types

`AutocompleteOptions<T>`, `AutocompleteController<T>`, `AutocompleteTarget`, `AutocompleteSource<T>`, `AutocompleteSourceFunction<T>`, `AutocompleteSourceContext`, `AutocompleteEndpoint`, `AutocompleteEndpointOptions<T>`, `AutocompleteRequestInit`, `AutocompleteParser`, `AutocompleteResponseMapper<T>`, `AutocompleteCacheOptions`, `AutocompleteCache<T>`, `AutocompleteSection<T>`, `AutocompleteState<T>`, `AutocompleteStatus`, `AutocompleteEventMap<T>`, `AutocompleteHooks<T>`, `AutocompleteTransformContext`, `AutocompletePlugin<T>`, `AutocompletePluginHooks<T>`, `AutocompleteSearch<T>`, `AutocompleteSearchOptions<T>`, `AutocompleteSearchResult<T>`, `MountAutocompleteOptions`, `AutocompleteSectionResult<T>`, `AutocompleteRecentOptions<T>`, `AutocompleteRecentStore<T>`, `AutocompleteStorage`, `CreateRecentStoreOptions<T>`, `AutocompleteHiddenInputOptions<T>`, `AutocompletePlacement`, `AutocompleteStatusState`, `AutocompleteStatusContext`, `AutocompleteResultsContext<T>`, `AutocompleteMessages`, `AutocompleteMessage`, `AutocompleteMessageContext`, `AutocompleteHighlightPart`, `AutocompleteRenderContext`, `AutocompleteNormalizer`, `FilterSuggestionsOptions<T>`, `AutocompleteSelectDetail<T>`, `AutocompleteLoadDetail<T>`, `AutocompleteErrorDetail`, `AutocompleteApi`, `AutocompleteAvailable` and `NewAutocompleteInput<T>`.
