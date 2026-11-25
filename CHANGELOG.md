# Changelog

All notable changes to `@samline/autocomplete` are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- A "Framework integrations" guide with React, Vue, Svelte, Astro and plain HTML/CDN usage. The React and Vue wrappers moved there from the recipes.

### Fixed

- `fromEndpoint` from `@samline/autocomplete/core` no longer reads `document`, so it works outside a browser (Node, workers) with an absolute endpoint; relative endpoints still resolve against the page URL.

## [3.0.0] - 2026-11-15

Family conventions: one bundle name, one stylesheet name and pnpm. The old file names still ship as aliases.

### Breaking changes

- The classic script no longer has a `default` export, so `window.Autocomplete.default` is gone, and the extra `window.AutocompleteBundle` global is removed. Use `window.Autocomplete`.
- `@samline/autocomplete/browser` no longer has a default export. Use `import { Autocomplete } from '@samline/autocomplete/browser'`.
- The standalone script is now `dist/browser/autocomplete.global.js` (the `./browser/global` export points to it) and the stylesheet is `dist/style.css` (export `./style.css`). `dist/browser/global.global.js` and `dist/styles.css` (export `./styles.css`) are still built as identical aliases.

### Changed

- The standalone script is minified.
- The package installs with pnpm and runs its scripts with Bun; CDN examples are pinned to 3.0.0.

### Tests

- Coverage thresholds (95 % statements, functions and lines, 90 % branches), gzip budgets for every public entry and browser tests in Chromium, Firefox and WebKit.

## [2.2.0] - 2026-11-14

Observable state, hooks, plugins, a headless search pipeline and a no-JavaScript setup. No breaking changes.

### Added

- Controller `getState()`, `subscribe(listener)` and `on(event, listener)`, each returning an unsubscribe function where it applies. The state holds `query`, `status`, `open`, `suggestions`, `sections`, `activeIndex` and `selected`.
- `controller.setValue(item)` to prefill the selection, input text and hidden input without events.
- `autocomplete:open` and `autocomplete:close` events.
- Hooks `beforeSearch` (rewrite or skip a query), `transformSuggestions` (before `maxResults`) and `beforeSelect` (veto).
- `plugins`: `{ name, setup(controller) }` returning hooks and a `destroy` callback.
- `createSearch(options)`: the DOM-free pipeline (sources, sections, filtering, cache, partial failures) for custom rendering, synchronous for local arrays and cache hits. `DEFAULT_SECTION_ID`.
- Declarative `mount({ defaults })`, `refresh()`, `unmount()` and `getMounted()` for `input[data-autocomplete]`, configured through `data-autocomplete-*` attributes; `optionsFromDataset(input)`. The standalone script mounts on load, and mounted inputs with an id join the registry.
- A "Recipes" guide (React, Vue, Alpine, Livewire, command palette, plugins, headless) and a "No JavaScript" example.

### Changed

- The search pipeline moved into `createSearch`, which the controller now uses; behavior is unchanged.

## [2.1.0] - 2026-11-14

Sections, recent selections, form fields, smarter placement and custom popup content. No breaking changes.

### Added

- `sections`: labelled groups (`role="group"`) searched in parallel, each with its own `source`, `maxResults`, `filter` and `cache`. A failing section is dropped and reported; the error state shows only when every pending section fails and nothing matched.
- `recent`: recent selections shown when the empty input gets focus or ArrowDown, stored in `localStorage` with a memory fallback. `createRecentStore()` and `controller.recent`.
- `hiddenInput`: a named hidden field (or an existing one) that holds the selected id, empties when the text changes and dispatches `change`. `controller.hiddenElement`.
- `placement` (`auto`, `bottom`, `top`) with `data-placement`; `auto` flips above when there is no room below.
- `popover` and `offset`: render the popup in the top layer with the Popover API, pinned to the input on scroll and resize.
- `renderStatus`, `renderHeader` and `renderFooter`.
- Event details: `sections` on `autocomplete:load`, `section` on `autocomplete:select` and `autocomplete:error`.
- Stylesheet rules for groups, header, footer, top placement and popovers.
- "Sections" and "Forms" examples.

### Changed

- The popup flips above the input when there is no room below. Set `placement: 'bottom'` to keep it below.
- Validation messages mention `sections` alongside `source` and `endpoint`.

## [2.0.0] - 2026-11-14

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

[2.2.0]: https://github.com/samline/autocomplete/releases/tag/v2.2.0
[2.1.0]: https://github.com/samline/autocomplete/releases/tag/v2.1.0
[2.0.0]: https://github.com/samline/autocomplete/releases/tag/v2.0.0
[1.0.0]: https://github.com/samline/autocomplete/releases/tag/v1.0.0
