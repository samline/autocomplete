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
- The highlighted option is announced through `aria-activedescendant`; options are `role="option"` buttons with `aria-selected`.
- Loading and empty states render as `role="status"` and errors as `role="alert"` inside the list.
- Keys: ArrowUp/ArrowDown move, Home/End jump to the first and last option, Enter selects, Escape and Tab close the list.
- IME composition (Japanese, Chinese, Korean) is respected: the search waits until the composition ends.
- `destroy()` restores the attributes it changed, including a pre-existing `autocomplete`.

## What your page provides

- A visible `<label for>` for the input.
- Messages in the page's language through `messages: { loading, empty, error }`.
- Enough contrast for the list colors if you override the `--autocomplete-*` variables.
