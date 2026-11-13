# API

## `createAutocomplete(target, options)`

Creates and returns an `AutocompleteController<T>`. `autocomplete` is an alias.

## Controller

| Member           | Description                                                       |
| ---------------- | ----------------------------------------------------------------- |
| `element`        | Managed input.                                                    |
| `listElement`    | Generated listbox.                                                |
| `options`        | Original options object.                                          |
| `search(query?)` | Runs an immediate remote search.                                  |
| `close()`        | Closes the popup and cancels the pending or in-flight search.     |
| `clear()`        | Clears input, selection, results, and pending work.               |
| `cancel()`       | Cancels debounce and active request.                              |
| `getSelected()`  | Returns the original selected object or `null`.                   |
| `destroy()`      | Cancels work, removes listeners/listbox, and restores attributes. |

## Helpers

- `mapCommonResponse(payload)`: accepts root arrays and `suggestions`, `items`, or `data` arrays.
- `parseJsonResponse(response)`: default JSON parser.
- `browser`: importable equivalent of the browser global registry.

## Events

- `autocomplete:loadstart`: `{ query }`
- `autocomplete:load`: `{ query, suggestions }`
- `autocomplete:error`: `{ query, error }`
- `autocomplete:clear`: `{ query }`
- `autocomplete:select`: `{ suggestion, label, value }`

Every event bubbles from the input.
