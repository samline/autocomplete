---
locale: en
sidebar:
  group: reference
  order: 1
title: 'Every option'
titleAccent: 'option'
description: 'Every createAutocomplete option with its default: sources, requests, response mapping, caching, filtering, highlighting, timing, messages and callbacks.'
---

Pass exactly one of `source` or `endpoint`.

## Source

| Option          | Default           | Description                                                                                                      |
| --------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| `source`        | none              | An array filtered locally, or `(query, { signal, input }) => items` (sync or async).                             |
| `endpoint`      | none              | URL, `URL` or `(query, input) => URL`.                                                                           |
| `queryParam`    | `'q'`             | Endpoint only. Query-string key; `null` when the endpoint function builds the complete URL.                      |
| `requestInit`   | `{}`              | Endpoint only. `RequestInit` or `(query, input) => RequestInit` for headers, credentials, method.                |
| `parseResponse` | `response.json()` | Endpoint only. Parses the response before mapping.                                                               |
| `mapResponse`   | common arrays     | Endpoint only. `(payload, response, query)`; the default reads a root array or `suggestions`, `items` or `data`. |
| `filter`        | label match       | Array only. `(item, query) => boolean`; the default matches every query word in the label.                       |
| `normalize`     | `normalizeText`   | Text comparison for the default filter and highlighting; ignores case and accents.                               |
| `cache`         | `true`            | Function and endpoint sources. `false`, or `{ max: 50, ttl: 300000 }` (queries, milliseconds).                   |

## Rendering

| Option         | Default                           | Description                                                                         |
| -------------- | --------------------------------- | ----------------------------------------------------------------------------------- |
| `getId`        | `id`, else the index              | Stable option id.                                                                   |
| `getLabel`     | `label`, `value`, `title`, `name` | Visible option text. Strings are used as they are.                                  |
| `getValue`     | `value`, `label`, `title`, `name` | Value written to the input on selection.                                            |
| `highlight`    | `true`                            | Wraps matching parts of the label in `<mark data-autocomplete-highlight>`.          |
| `renderOption` | none                              | `(option, suggestion, { query, index, label, highlight })`; customize without HTML. |

## Timing and limits

| Option          | Default               | Description                                                     |
| --------------- | --------------------- | --------------------------------------------------------------- |
| `minLength`     | `2`, `1` for arrays   | Minimum query length before searching. `0` searches on focus.   |
| `debounce`      | `250`, `0` for arrays | Delay in milliseconds after typing stops.                       |
| `maxResults`    | `8`                   | Maximum rendered suggestions.                                   |
| `searchOnFocus` | `true`                | Search again on focus when the input already has a valid query. |

## Messages and callbacks

| Option     | Default | Description                                                                                    |
| ---------- | ------- | ---------------------------------------------------------------------------------------------- |
| `messages` | English | Partial `{ loading, empty, error, results }`; each a string or `({ query, count }) => string`. |
| `onSelect` | none    | `(suggestion, input)` after a selection.                                                       |
| `onError`  | none    | `(error, input)` for source, request, parsing and mapping failures.                            |

`results` is announced through the live region when suggestions load (default `1 result available` / `N results available`). `empty` and `error` are shown and announced; `loading` is only shown.

Invalid numeric or cache options throw during initialization. Source, HTTP, parsing and mapping failures render the error state and dispatch `autocomplete:error`; sources and `mapResponse` must return an array. Failures are never cached.
