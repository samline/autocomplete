# TypeScript

All public contracts are exported from `@samline/autocomplete`.

```ts
import {
  createAutocomplete,
  type AutocompleteController,
  type AutocompleteOptions,
  type AutocompleteSelectDetail
} from '@samline/autocomplete'

interface Product {
  sku: string
  name: string
}

const options: AutocompleteOptions<Product> = {
  endpoint: '/api/products',
  mapResponse: (payload) => (payload as { products: Product[] }).products,
  getId: (product) => product.sku,
  getLabel: (product) => product.name
}

const controller: AutocompleteController<Product> = createAutocomplete('#product', options)
```

Event detail types are exported for typed listeners: `AutocompleteSelectDetail<T>`, `AutocompleteLoadDetail<T>`, and `AutocompleteErrorDetail`.
