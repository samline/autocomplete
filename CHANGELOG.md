# Changelog

All notable changes to `@samline/autocomplete` are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.0]: https://github.com/samline/autocomplete/releases/tag/v1.0.0
