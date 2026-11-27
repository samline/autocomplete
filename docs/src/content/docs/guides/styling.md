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
import '@samline/autocomplete/style.css'
```

## DOM contract

```html
<input role="combobox" … />
<div data-autocomplete-popup data-placement="bottom">
  <div data-autocomplete-header>…</div>
  <div role="listbox" data-autocomplete-list>
    <div role="group" data-autocomplete-group="cities" aria-labelledby="…">
      <div role="presentation" data-autocomplete-group-label>Cities</div>
      <div role="option" data-autocomplete-option data-active="true">
        <mark data-autocomplete-highlight>Mér</mark>ida
      </div>
    </div>
  </div>
  <div data-autocomplete-footer>…</div>
  <div data-autocomplete-status="empty">No results</div>
</div>
<div role="status" data-autocomplete-live>1 result available</div>
<input type="hidden" name="city_id" data-autocomplete-hidden />
```

| Selector                                                     | What it is                                             |
| ------------------------------------------------------------ | ------------------------------------------------------ |
| `[data-autocomplete-popup]`                                  | The positioned container, placed right after the input |
| `[data-autocomplete-list]`                                   | The listbox inside the popup                           |
| `[data-placement='bottom' \| 'top']`                         | The side the popup opened on                           |
| `[data-autocomplete-group]`                                  | A section group (its value is the section id)          |
| `[data-autocomplete-group-label]`                            | A section heading                                      |
| `[data-autocomplete-header]`, `[data-autocomplete-footer]`   | `renderHeader` and `renderFooter` containers           |
| `[data-autocomplete-hidden]`                                 | A hidden input created by `hiddenInput`                |
| `[data-autocomplete-option]`                                 | One suggestion                                         |
| `[data-active='true']`                                       | The keyboard or pointer highlighted option             |
| `[data-autocomplete-highlight]`                              | A matching part of the label (a `<mark>`)              |
| `[data-autocomplete-status='loading' \| 'empty' \| 'error']` | The visible request state, outside the listbox         |
| `[data-autocomplete-live]`                                   | The visually hidden live region, styled inline         |

The popup, list, status, header and footer use the native `hidden` attribute while closed. While open, the popup also gets an inline `max-height` that caps `--autocomplete-max-height` to the free space on the side it opened on (measured against the visual viewport, so an on-screen keyboard counts); it is removed on close. With `popover: true` the popup also gets `popover="manual"` and inline fixed coordinates.

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

Also available: `--autocomplete-z-index`, `--autocomplete-offset`, `--autocomplete-shadow`, `--autocomplete-option-padding`, `--autocomplete-active-color`, `--autocomplete-active-ring` (`currentColor`: an inset 2px ring on the active option, because the background tint alone has too little contrast; set it to `transparent` only if your `--autocomplete-active-background` already contrasts 3:1 with the popup), `--autocomplete-muted-color`, `--autocomplete-error-color`, `--autocomplete-highlight-background` (`transparent`), `--autocomplete-highlight-color` (`inherit`) `--autocomplete-highlight-weight` (`600`), `--autocomplete-group-padding` and `--autocomplete-group-font-size`. In forced-colors mode the active option gets a system-color outline.

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
