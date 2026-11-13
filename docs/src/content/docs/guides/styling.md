---
locale: en
sidebar:
  group: guides
  order: 3
title: 'Style it your way'
titleAccent: 'your way'
description: 'Theme the optional stylesheet with CSS custom properties or style the list, options and states through a small data-attribute contract.'
---

Import the optional stylesheet once:

```js
import '@samline/autocomplete/styles.css'
```

## DOM contract

| Selector                                                     | What it is                                       |
| ------------------------------------------------------------ | ------------------------------------------------ |
| `[data-autocomplete-list]`                                   | The list container, placed right after the input |
| `[data-autocomplete-option]`                                 | One suggestion button                            |
| `[data-active='true']`                                       | The keyboard or pointer highlighted option       |
| `[data-autocomplete-status='loading' \| 'empty' \| 'error']` | The request state                                |

## Custom properties

```css
.search-field {
  --autocomplete-background: #111827;
  --autocomplete-color: #f9fafb;
  --autocomplete-active-background: #374151;
  --autocomplete-border: #4b5563;
  --autocomplete-radius: 0.75rem;
  --autocomplete-max-height: 20rem;
}
```

Also available: `--autocomplete-z-index`, `--autocomplete-offset`, `--autocomplete-shadow`, `--autocomplete-option-padding`, `--autocomplete-active-color`, `--autocomplete-muted-color` and `--autocomplete-error-color`.

## Richer options

`renderOption(option, suggestion)` receives the created button. Append elements instead of setting HTML strings, so suggestion data is never parsed as markup.
