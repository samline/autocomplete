# Changelog

All notable changes to `@samline/autocomplete` are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - Unreleased

Sources beyond HTTP, caching, highlighting, a stricter listbox and the registry shared by the other `@samline` packages.

### Breaking

- The browser registry follows the shared `@samline` shape: `newAutocomplete({ id, options })`, `getAutocomplete(id)`, `getAutocompletes()`, `destroyAutocomplete(idOrInput)` and `destroyAutocompletes()` replace `create(target, options)` and `destroy(id)`. `newAutocomplete` logs and returns `null` instead of throwing when the id or input is missing.
- `@samline/autocomplete/browser` is now the registry as an ESM/CommonJS module. The standalone script moved to `@samline/autocomplete/browser/global` (the file is still `dist/browser/global.global.js`).
- Options are `<div role="option">` elements instead of `<button>`, so they are no longer Tab stops. `renderOption` receives an `HTMLElement` and a third `context` argument.
- The listbox now sits inside `[data-autocomplete-popup]`, which carries the positioning styles. Loading, empty and error messages render in `[data-autocomplete-status]` outside the listbox, instead of inside it with `role="status"` / `role="alert"`; a separate polite live region announces them. Update selectors that targeted `[data-autocomplete-list]` for positioning.
- Labels are highlighted by default. Set `highlight: false` for plain text.
- Function and endpoint results are cached per query for five minutes by default. Set `cache: false` for the previous behavior.
- `createAutocompleteController` is removed; use `createAutocomplete` or `autocomplete`.
- The default label and value also read a `name` field.

### Added

- `source`: a local array filtered in the browser, or `(query, { signal, input }) => items`, as an alternative to `endpoint`. Array sources default to `minLength: 1` and `debounce: 0`.
- `filter` and `normalize` options; matching ignores case and accents by default.
- `cache` (`true`, `false` or `{ max, ttl }`) and `controller.clearCache()`. `autocomplete:load` reports `cached`.
- `highlight` option and `<mark data-autocomplete-highlight>` rendering. `renderOption` context `{ query, index, label, highlight }`.
- `messages.results` and message functions of `{ query, count }` for translations and plurals.
- Controller `popupElement`, `statusElement` and `liveElement`. The listbox is labelled by the input's `<label>`.
- Helpers `fromEndpoint`, `filterSuggestions`, `normalizeText`, `highlight`, `renderHighlight`, `createCache` and `DEFAULT_MESSAGES`.
- Entrypoints `@samline/autocomplete/core`, `@samline/autocomplete/vanilla` and the `style.css` alias.
- Stylesheet: highlight custom properties and a forced-colors outline for the active option.
- A "Local data" example.

## [1.0.0] - 2026-11-13

First public release.

### Added

- `createAutocomplete(input, options)` (alias `autocomplete`) turns an existing text input into an accessible remote combobox: debounce, abortable requests, stale-response protection, listbox rendering, keyboard and pointer selection, events and cleanup.
- Options: `endpoint`, `queryParam`, `requestInit`, `parseResponse`, `mapResponse`, `getId`, `getLabel`, `getValue`, `renderOption`, `minLength`, `debounce`, `maxResults`, `searchOnFocus`, `messages`, `onSelect` and `onError`.
- Events `autocomplete:loadstart`, `autocomplete:load`, `autocomplete:error`, `autocomplete:select` and `autocomplete:clear`.
- Keyboard: ArrowUp, ArrowDown, Home, End, Enter, Escape and Tab. Searches wait for IME composition to finish.
- Browser global `window.Autocomplete` with `create`, `destroy`, `available` and `autocomplete`, and an optional stylesheet themed with `--autocomplete-*` custom properties.
- Website with examples and documentation at https://samline.github.io/autocomplete/.

### Fixed (since the unpublished 0.1.0)

- Escape, Tab, clicking outside, selecting a suggestion and `close()` cancel the pending debounced search and abort the request in flight. Before, a late response reopened the list after it was dismissed.
- The standalone script defines `window.Autocomplete` with its documented members. Before, the global was wrapped as `{ default }`.

[2.0.0]: https://github.com/samline/autocomplete/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/samline/autocomplete/releases/tag/v1.0.0
