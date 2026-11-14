---
locale: en
sidebar:
  group: reference
  order: 2
title: 'API reference'
titleAccent: 'reference'
description: 'createAutocomplete, the controller members, the response helpers, the browser global registry and every event with its detail.'
---

## `createAutocomplete(target, options)`

`target` is an `HTMLInputElement` or a selector. Returns an `AutocompleteController<T>`. `autocomplete` is an alias. Throws a `TypeError` when the target is not an input or an option is invalid.

## Controller

| Member           | Description                                                        |
| ---------------- | ------------------------------------------------------------------ |
| `element`        | The managed input.                                                 |
| `listElement`    | The generated listbox.                                             |
| `options`        | The options object you passed.                                     |
| `search(query?)` | Runs a search now, without debounce.                               |
| `close()`        | Closes the list and cancels the pending or in-flight search.       |
| `clear()`        | Clears the input, selection, results and pending work.             |
| `cancel()`       | Cancels the debounce timer and aborts the active request.          |
| `getSelected()`  | The original selected suggestion, or `null`.                       |
| `destroy()`      | Cancels work, removes listeners and the list, restores attributes. |

## Helpers

- `createAutocompleteController(target, options)`: the core factory behind `createAutocomplete`; same arguments and controller.
- `mapCommonResponse(payload)`: reads a root array or `suggestions`, `items` or `data` arrays.
- `parseJsonResponse(response)`: the default JSON parser.
- `browser`: the importable equivalent of the browser global.

## Browser global

The CDN bundle defines `window.Autocomplete` with `create(target, options)` (requires an input id and registers the controller), `destroy(id)`, `available` (controllers by id) and `autocomplete(target, options)`.

## Events

All events bubble from the input.

| Event                    | `detail`                       |
| ------------------------ | ------------------------------ |
| `autocomplete:loadstart` | `{ query }`                    |
| `autocomplete:load`      | `{ query, suggestions }`       |
| `autocomplete:error`     | `{ query, error }`             |
| `autocomplete:select`    | `{ suggestion, label, value }` |
| `autocomplete:clear`     | `{ query }`                    |

## Types

`AutocompleteOptions<T>`, `AutocompleteController<T>`, `AutocompleteTarget`, `AutocompleteEndpoint`, `AutocompleteRequestInit`, `AutocompleteParser`, `AutocompleteResponseMapper<T>`, `AutocompleteMessages`, `AutocompleteSelectDetail<T>`, `AutocompleteLoadDetail<T>`, `AutocompleteErrorDetail`, `AutocompleteApi` and `AutocompleteAvailable`.
