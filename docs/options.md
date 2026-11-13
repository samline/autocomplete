# Options

| Option          | Default                   | Description                                                                      |
| --------------- | ------------------------- | -------------------------------------------------------------------------------- |
| `endpoint`      | required                  | URL or `(query, input) => URL`.                                                  |
| `queryParam`    | `'q'`                     | Query-string key. Set `null` when the endpoint resolver builds the complete URL. |
| `requestInit`   | `{}`                      | `RequestInit` or resolver for headers, credentials, method, etc.                 |
| `parseResponse` | `response.json()`         | Parses the response before mapping.                                              |
| `mapResponse`   | common arrays             | Extracts suggestions from a root array or `suggestions`, `items`, or `data`.     |
| `getId`         | `item.id`                 | Stable option id adapter.                                                        |
| `getLabel`      | `label`, `value`, `title` | Visible listbox text.                                                            |
| `getValue`      | `value`, `label`, `title` | Value written to the input.                                                      |
| `renderOption`  | none                      | Safely customizes the created button without accepting HTML strings.             |
| `minLength`     | `2`                       | Minimum query length.                                                            |
| `debounce`      | `250`                     | Delay in milliseconds.                                                           |
| `maxResults`    | `8`                       | Maximum rendered results.                                                        |
| `searchOnFocus` | `true`                    | Searches a valid existing value on focus.                                        |
| `messages`      | English defaults          | Partial `{ loading, empty, error }` labels.                                      |
| `onSelect`      | none                      | Receives the original suggestion and input.                                      |
| `onError`       | none                      | Receives request/mapping errors and input.                                       |

Invalid numeric options fail during initialization. HTTP, parsing, and mapping failures render the error state and emit `autocomplete:error`.
