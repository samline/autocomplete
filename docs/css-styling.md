# CSS styling

Import the optional base stylesheet once:

```ts
import '@samline/autocomplete/styles.css'
```

The DOM contract is intentionally small:

- `[data-autocomplete-list]`: popup container.
- `[data-autocomplete-option]`: suggestion button.
- `[data-active='true']`: keyboard/pointer-highlighted option.
- `[data-autocomplete-status='loading|empty|error']`: request state.

Customize with variables on a wrapper:

```css
.search-field {
  --autocomplete-background: #111827;
  --autocomplete-color: #f9fafb;
  --autocomplete-active-background: #374151;
  --autocomplete-border: #4b5563;
  --autocomplete-radius: 0.75rem;
}
```

The wrapper around the input should normally use `position: relative` because the default listbox is absolutely positioned.
