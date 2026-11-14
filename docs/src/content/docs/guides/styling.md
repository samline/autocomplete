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

```html
<input role="combobox" … />
<div data-autocomplete-popup>
  <div role="listbox" data-autocomplete-list>
    <div role="option" data-autocomplete-option data-active="true">
      <mark data-autocomplete-highlight>Mér</mark>ida
    </div>
  </div>
  <div data-autocomplete-status="empty">No results</div>
</div>
<div role="status" data-autocomplete-live>1 result available</div>
```

| Selector                                                     | What it is                                             |
| ------------------------------------------------------------ | ------------------------------------------------------ |
| `[data-autocomplete-popup]`                                  | The positioned container, placed right after the input |
| `[data-autocomplete-list]`                                   | The listbox inside the popup                           |
| `[data-autocomplete-option]`                                 | One suggestion                                         |
| `[data-active='true']`                                       | The keyboard or pointer highlighted option             |
| `[data-autocomplete-highlight]`                              | A matching part of the label (a `<mark>`)              |
| `[data-autocomplete-status='loading' \| 'empty' \| 'error']` | The visible request state, outside the listbox         |
| `[data-autocomplete-live]`                                   | The visually hidden live region, styled inline         |

The popup, list and status use the native `hidden` attribute while closed.

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

Also available: `--autocomplete-z-index`, `--autocomplete-offset`, `--autocomplete-shadow`, `--autocomplete-option-padding`, `--autocomplete-active-color`, `--autocomplete-muted-color`, `--autocomplete-error-color`, `--autocomplete-highlight-background` (`transparent`), `--autocomplete-highlight-color` (`inherit`) and `--autocomplete-highlight-weight` (`600`). In forced-colors mode the active option gets a system-color outline.

## Richer options

`renderOption(option, suggestion, context)` receives the created option, already filled with the highlighted label, and `{ query, index, label, highlight }`. Append elements instead of setting HTML strings, so suggestion data is never parsed as markup. To restructure the option, empty it and reuse the highlight:

```js
import { renderHighlight } from '@samline/autocomplete'

const renderOption = (option, city, { highlight }) => {
  option.replaceChildren()
  const name = document.createElement('strong')
  renderHighlight(name, highlight)
  const country = document.createElement('small')
  country.textContent = city.country
  option.append(name, country)
}
```
