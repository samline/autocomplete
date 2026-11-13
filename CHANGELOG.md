# Changelog

All notable changes to `@samline/autocomplete` are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `Home` and `End` move to the first and last suggestion while the list is open.
- Searches wait for IME composition to finish (`compositionend`) instead of querying half-composed text.

### Fixed

- `Escape`, `Tab`, clicking outside, selecting a suggestion and `close()` now cancel the pending debounced search and abort the request in flight. Before, a late response reopened the list after it was dismissed.

## [0.1.0]

- Initial version: remote combobox with debounce, abortable requests, stale-response protection, accessible listbox, keyboard and pointer selection, events and cleanup.
