---
locale: en
sidebar:
  group: guides
  order: 2
title: 'Accessibility built in'
titleAccent: 'built in'
description: 'The ARIA combobox pattern, keyboard support, status messages and what your markup still has to provide for an accessible search.'
---

## What the package provides

- The input becomes `role="combobox"` with `aria-autocomplete="list"`, `aria-controls` pointing to the generated `role="listbox"`, and `aria-expanded` kept in sync.
- The listbox is named by the input's `<label>` through `aria-labelledby`; a label without an id gets one, removed again on `destroy()`.
- Focus stays on the input. The active option is announced through `aria-activedescendant` and marked with `aria-selected`, as in the WAI-ARIA editable combobox pattern. Options are non-focusable `role="option"` elements, so they never become Tab stops.
- The listbox only ever contains options. Loading, empty and error messages are shown in a separate element outside it.
- A visually hidden polite live region (`role="status"`) announces the result count, the empty message and errors. Loading is shown but not announced, so fast typing stays quiet.
- Matches are marked with `<mark>`, which keeps the label text intact for screen readers.
- Keys: ArrowUp/ArrowDown move, Home/End jump to the first and last option, Enter selects, Escape and Tab close the list.
- IME composition (Japanese, Chinese, Korean) is respected: the search waits until the composition ends.
- `destroy()` restores the attributes it changed, including a pre-existing `autocomplete`.

## What your page provides

- A visible `<label for>` for the input.
- Messages in the page's language through `messages: { loading, empty, error, results }`. Each is a string or a function of `{ query, count }`, so plurals and the typed query can be part of the announcement.
- Enough contrast for the list colors if you override the `--autocomplete-*` variables.
