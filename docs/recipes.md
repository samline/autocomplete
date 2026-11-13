# Recipes

## Authorization headers

```ts
createAutocomplete('#user', {
  endpoint: '/api/users',
  requestInit: () => ({
    headers: { Authorization: `Bearer ${getToken()}` }
  })
})
```

## Endpoint resolver

```ts
createAutocomplete('#product', {
  endpoint: (query) => `/api/catalog/${encodeURIComponent(query)}`,
  queryParam: null
})
```

## Next.js cleanup

```ts
useEffect(() => {
  const controller = createAutocomplete(inputRef.current!, options)
  return () => controller.destroy()
}, [])
```

## Custom response parser

```ts
createAutocomplete('#search', {
  endpoint: '/search.txt',
  parseResponse: async (response) => response.text(),
  mapResponse: (text) => String(text).split('\n')
})
```
