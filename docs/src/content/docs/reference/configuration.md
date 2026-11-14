---
locale: en
sidebar:
  group: reference
  order: 1
title: 'Every option'
titleAccent: 'option'
description: 'Every createAutocomplete option with its default: sources, requests, response mapping, caching, filtering, highlighting, timing, messages and callbacks.'
---

Pass exactly one of `source`, `endpoint` or `sections`.

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
| `sections`      | none              | Labelled groups searched in parallel: `{ id, label?, source, maxResults?, filter?, cache? }[]`.                  |
| `cache`         | `true`            | Function and endpoint sources. `false`, or `{ max: 50, ttl: 300000 }` (queries, milliseconds).                   |

## Sections

Each section has a unique `id` (letters, digits, `-`, `_`), an optional `label` rendered as a group heading, and its own `source` (array or function). `maxResults`, `filter` and `cache` default to the instance options. Sections are searched in parallel and rendered in order; one failing section is dropped and reported through `autocomplete:error`, and the error state is shown only when every pending section fails and nothing else matched. When every section is an array, `minLength` defaults to `1` and `debounce` to `0`.

## Recent selections and forms

| Option        | Default | Description                                                                                                                       |
| ------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `recent`      | none    | `true` or `{ store?, max?: 5, label?: 'Recent searches' }`. Shows recent selections when the empty input gets focus or ArrowDown. |
| `hiddenInput` | none    | A field name, or `{ name?, element?, getValue? }`. Holds the selection's id (or `getValue`) and empties when the text changes.    |

The default recent store uses `localStorage` under `autocomplete:recent:<input id>`, falls back to memory without an id or when storage is blocked, and dedupes by `getId`. Keep suggestions JSON-serializable, or pass your own store from `createRecentStore()`. The hidden input dispatches a bubbling `change` event when its value changes; a created one is removed on `destroy()`, an existing `element` is kept.

## Rendering

| Option         | Default                           | Description                                                                                                                 |
| -------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `getId`        | `id`, else the index              | Stable option id.                                                                                                           |
| `getLabel`     | `label`, `value`, `title`, `name` | Visible option text. Strings are used as they are.                                                                          |
| `getValue`     | `value`, `label`, `title`, `name` | Value written to the input on selection.                                                                                    |
| `highlight`    | `true`                            | Wraps matching parts of the label in `<mark data-autocomplete-highlight>`.                                                  |
| `renderStatus` | none                              | `(element, { state, query, error? })`; replace the visible loading, empty or error copy. The live region keeps the message. |
| `renderHeader` | none                              | `(element, { query, count, sections })`; content above the listbox while results show.                                      |
| `renderFooter` | none                              | `(element, { query, count, sections })`; content below the listbox while results show.                                      |
| `renderOption` | none                              | `(option, suggestion, { query, index, label, highlight })`; customize without HTML.                                         |

## Placement

| Option      | Default  | Description                                                                                           |
| ----------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `placement` | `'auto'` | `'auto'` opens below and flips above when there is no room; `'bottom'` or `'top'` fix the side.       |
| `popover`   | `false`  | Render the popup in the top layer with the Popover API, escaping `overflow: hidden` and stacking.     |
| `offset`    | `4`      | Gap in CSS pixels between the input and a popover popup. Absolute popups use `--autocomplete-offset`. |

The chosen side is written to `data-placement`. Without Popover API support, `popover: true` falls back to the absolute popup.

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
