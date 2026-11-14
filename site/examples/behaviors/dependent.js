// Self-contained: the gallery derives its copyable JavaScript from this setup.
export const setupDependent = (root, createAutocomplete) => {
  const form = root.querySelector('form')
  const country = root.querySelector('select')
  const input = root.querySelector('input[type="text"]')
  const note = root.querySelector('[data-note]')
  const { endpoint } = root.querySelector('[data-endpoint]').dataset
  const events = new AbortController()
  const controller = createAutocomplete(input, {
    // A function endpoint reads the other field on every request; `q` is
    // still appended. This static file ignores both, so mapResponse filters.
    endpoint: () => `${endpoint}?country=${encodeURIComponent(country.value)}`,
    mapResponse: (payload, _response, query) =>
      payload.results.filter(
        city =>
          city.country === country.value && city.name.toLowerCase().includes(query.toLowerCase())
      ),
    minLength: 0,
    getId: city => city.key,
    getLabel: city => city.name,
    hiddenInput: 'city_id',
    messages: { empty: ({ query }) => `No city in ${country.value} matches “${query}”.` },
  })
  country.addEventListener(
    'change',
    () => {
      // Results are cached per query, so a new country must forget them.
      controller.clearCache()
      controller.clear()
      input.disabled = !country.value
      note.textContent = country.value
        ? `Cities in ${country.value}. Focus the field to list them all.`
        : 'Choose a country first.'
      if (country.value) input.focus()
    },
    { signal: events.signal }
  )
  form.addEventListener(
    'submit',
    event => {
      event.preventDefault()
      const data = new FormData(form)
      note.textContent = data.get('city_id')
        ? `Submitted country=${data.get('country')}, city_id=${data.get('city_id')}.`
        : 'Pick a city first.'
    },
    { signal: events.signal }
  )
  return () => {
    events.abort()
    controller.destroy()
  }
}
