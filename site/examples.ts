// Copyable files load the published browser bundle (window.Autocomplete) and
// the site's public cities.json; the previews in examples/*.astro import the
// package itself.
const endpoint = 'https://samline.github.io/autocomplete/cities.json'

const baseCss = `.field { position: relative; max-width: 28rem; }
label { display: block; margin-bottom: 0.5rem; font-weight: 600; }
input { width: 100%; padding: 0.75rem 1rem; border: 1px solid #aaa; border-radius: 0.5rem; font: inherit; }`

const filter = `mapResponse: (payload, response, query) =>
      payload.results.filter(city => city.name.toLowerCase().includes(query.toLowerCase())),`

export default [
  {
    id: 'basic',
    tab: 'Basic',
    title: 'Search a remote list as you type',
    description:
      'Two characters start a debounced request. Arrow keys, Home, End, Enter, Escape and Tab work out of the box, and a late response never reopens a closed list.',
    files: {
      html: `<div class="field">
  <label for="city">City</label>
  <input id="city" type="text" />
</div>
<p id="selected" aria-live="polite">Nothing selected yet.</p>`,
      css: baseCss,
      js: `window.Autocomplete.newAutocomplete({
  id: 'city',
  options: {
    endpoint: '${endpoint}',
    minLength: 2,
    ${filter}
    getId: city => city.key,
    getLabel: city => \`\${city.name}, \${city.country}\`,
    getValue: city => city.name,
    onSelect: city => {
      document.querySelector('#selected').textContent = \`Selected \${city.name}.\`
    },
  },
})`,
    },
  },
  {
    id: 'render',
    tab: 'Custom options',
    title: 'Render richer options',
    description:
      'renderOption receives each option element, its suggestion and the render context, so you can append a secondary line with DOM nodes instead of HTML strings.',
    files: {
      html: `<div class="field">
  <label for="destination">Destination</label>
  <input id="destination" type="text" />
</div>`,
      css: `${baseCss}
[data-autocomplete-option] small { display: block; color: #666; }`,
      js: `window.Autocomplete.newAutocomplete({
  id: 'destination',
  options: {
    endpoint: '${endpoint}',
    minLength: 1,
    maxResults: 5,
    ${filter}
    getId: city => city.key,
    getLabel: city => city.name,
    renderOption: (option, city) => {
      const country = document.createElement('small')
      country.textContent = city.country
      option.append(country)
    },
  },
})`,
    },
  },
  {
    id: 'events',
    tab: 'Events',
    title: 'React to selection and clearing',
    description:
      'Listen for autocomplete:select and autocomplete:clear on the input to keep a hidden id field in sync. Editing the text after a selection also clears it.',
    files: {
      html: `<div class="field">
  <label for="origin">Origin</label>
  <input id="origin" type="text" />
</div>
<input type="hidden" id="origin-key" name="origin" />
<p id="log" aria-live="polite">No events yet.</p>
<button type="button" id="reset">Clear</button>`,
      css: baseCss,
      js: `const input = document.querySelector('#origin')
const key = document.querySelector('#origin-key')
const log = document.querySelector('#log')

const controller = window.Autocomplete.newAutocomplete({
  id: 'origin',
  options: {
    endpoint: '${endpoint}',
    ${filter}
    getId: city => city.key,
    getLabel: city => city.name,
  },
})

input.addEventListener('autocomplete:select', event => {
  key.value = event.detail.suggestion.key
  log.textContent = \`select: \${event.detail.label} (key \${key.value})\`
})
input.addEventListener('autocomplete:clear', () => {
  key.value = ''
  log.textContent = 'clear: selection removed'
})
document.querySelector('#reset').addEventListener('click', () => controller.clear())`,
    },
  },
  {
    id: 'local',
    tab: 'Local data',
    title: 'Filter a local list without a server',
    description:
      'Pass an array as source and the list is filtered in the browser, ignoring case and accents: typing “merida” finds “Mérida”. The matching part of each label is highlighted.',
    files: {
      html: `<div class="field">
  <label for="state">Mexican state</label>
  <input id="state" type="text" />
</div>`,
      css: baseCss,
      js: `window.Autocomplete.newAutocomplete({
  id: 'state',
  options: {
    source: [
      'Aguascalientes', 'Baja California', 'Campeche', 'Ciudad de México', 'Michoacán',
      'Morelos', 'Nuevo León', 'Querétaro', 'San Luis Potosí', 'Yucatán',
    ],
    messages: { empty: ({ query }) => \`No state matches “\${query}”\` },
  },
})`,
    },
  },
  {
    id: 'sections',
    tab: 'Sections',
    title: 'Group several sources and remember recent picks',
    description:
      'sections searches a local list and a remote endpoint in parallel and renders each under its own heading. With recent, the last selections appear when the empty input gets focus or ArrowDown.',
    files: {
      html: `<div class="field">
  <label for="place">Country or city</label>
  <input id="place" type="text" placeholder="Try “sp” or “ja”" />
</div>`,
      css: baseCss,
      js: `window.Autocomplete.newAutocomplete({
  id: 'place',
  options: {
    sections: [
      {
        id: 'countries',
        label: 'Countries',
        source: ['Argentina', 'Canada', 'Japan', 'Mexico', 'Portugal', 'Spain'],
      },
      {
        id: 'cities',
        label: 'Cities',
        maxResults: 4,
        source: async (query, { signal }) => {
          const response = await fetch('${endpoint}', { signal })
          const payload = await response.json()
          return payload.results
            .filter(city => city.name.toLowerCase().includes(query.toLowerCase()))
            .map(city => city.name)
        },
      },
    ],
    minLength: 2,
    recent: { label: 'Recent' },
  },
})`,
    },
  },
  {
    id: 'form',
    tab: 'Forms',
    title: 'Submit an id with a form',
    description:
      'hiddenInput creates a named hidden field that holds the selected id and empties when the text changes. popover renders the list in the top layer, so it escapes the card’s overflow: hidden.',
    files: {
      html: `<form id="trip" class="card">
  <div class="field">
    <label for="destination-city">Destination</label>
    <input id="destination-city" type="text" />
  </div>
  <button type="submit">Submit</button>
</form>
<p id="submitted" aria-live="polite">Nothing submitted yet.</p>`,
      css: `${baseCss}
.card { overflow: hidden; max-width: 28rem; padding: 1rem; border: 1px solid #aaa; border-radius: 0.75rem; }
.card button { margin-top: 0.75rem; }`,
      js: `window.Autocomplete.newAutocomplete({
  id: 'destination-city',
  options: {
    endpoint: '${endpoint}',
    ${filter}
    getId: city => city.key,
    getLabel: city => city.name,
    hiddenInput: 'city_id',
    popover: true,
  },
})

document.querySelector('#trip').addEventListener('submit', event => {
  event.preventDefault()
  const cityId = new FormData(event.currentTarget).get('city_id')
  document.querySelector('#submitted').textContent = cityId
    ? \`Submitted city_id=\${cityId}.\`
    : 'Pick a city first.'
})`,
    },
  },
  {
    id: 'declarative',
    tab: 'No JavaScript',
    title: 'Configure it with data attributes',
    description:
      'The standalone script mounts every input with data-autocomplete. Point it at an endpoint or a JSON list and tune it with data-autocomplete-* attributes, without writing a line of JavaScript.',
    files: {
      html: `<script type="application/json" id="fruits">
  ["Aguacate", "Guayaba", "Limón", "Mamey", "Mango", "Papaya", "Pitahaya", "Tamarindo"]
</script>

<div class="field">
  <label for="fruit">Fruit</label>
  <input
    id="fruit"
    type="text"
    data-autocomplete
    data-autocomplete-source="#fruits"
    data-autocomplete-empty="No fruit matches"
  />
</div>`,
      css: baseCss,
      js: `// Nothing to write: the browser bundle mounts input[data-autocomplete] on load.
// Read a mounted controller with window.Autocomplete.getAutocomplete('fruit').`,
    },
  },
] as const
