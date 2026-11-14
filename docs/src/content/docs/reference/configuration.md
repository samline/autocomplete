---
locale: en
sidebar:
  group: reference
  order: 1
title: 'Every option'
titleAccent: 'option'
description: 'Every createAutocomplete option with its default: endpoint, request, response mapping, labels, timing, limits, messages and callbacks.'
---

| Option          | Default                   | Description                                                                                       |
| --------------- | ------------------------- | ------------------------------------------------------------------------------------------------- |
| `endpoint`      | required                  | URL, `URL` or `(query, input) => URL`.                                                            |
| `queryParam`    | `'q'`                     | Query-string key. Use `null` when the endpoint function builds the complete URL.                  |
| `requestInit`   | `{}`                      | `RequestInit` or `(query, input) => RequestInit` for headers, credentials, method.                |
| `parseResponse` | `response.json()`         | Parses the response before mapping.                                                               |
| `mapResponse`   | common arrays             | `(payload, response, query)`; the default reads a root array or `suggestions`, `items` or `data`. |
| `getId`         | `id`, else the index      | Stable option id.                                                                                 |
| `getLabel`      | `label`, `value`, `title` | Visible option text.                                                                              |
| `getValue`      | `value`, `label`, `title` | Value written to the input on selection.                                                          |
| `renderOption`  | none                      | `(option, suggestion)`; customize the created button without HTML strings.                        |
| `minLength`     | `2`                       | Minimum query length before searching.                                                            |
| `debounce`      | `250`                     | Delay in milliseconds after typing stops.                                                         |
| `maxResults`    | `8`                       | Maximum rendered suggestions.                                                                     |
| `searchOnFocus` | `true`                    | Search again on focus when the input already has a valid query.                                   |
| `messages`      | English                   | Partial `{ loading, empty, error }`.                                                              |
| `onSelect`      | none                      | `(suggestion, input)` after a selection.                                                          |
| `onError`       | none                      | `(error, input)` for request, parsing and mapping failures.                                       |

Invalid numeric options throw during initialization. HTTP, parsing and mapping failures render the error state and dispatch `autocomplete:error`; `mapResponse` must return an array.
