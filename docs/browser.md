# Browser global

Use the IIFE build when no bundler is available:

```html
<link rel="stylesheet" href="https://unpkg.com/@samline/autocomplete@0.1.0/dist/styles.css" />
<input id="search" />
<script src="https://unpkg.com/@samline/autocomplete@0.1.0/dist/browser/global.global.js"></script>
<script>
  const controller = window.Autocomplete.create('#search', {
    endpoint: '/api/search'
  })
</script>
```

`Autocomplete.create` requires an input id and stores the controller in `Autocomplete.available[id]`. `Autocomplete.destroy(id)` destroys and removes it. `Autocomplete.autocomplete(input, options)` is the direct factory without registry behavior.

Pin a package version in production.
