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
      'Two characters start a debounced request; arrows, Home, End, Enter and Escape work out of the box, and a late response never reopens a closed list.',
    files: {
      html: `<div class="field">
  <label for="city">City</label>
  <input id="city" type="text" />
</div>
<p id="selected" aria-live="polite">Nothing selected yet.</p>`,
      css: baseCss,
      js: `window.Autocomplete.create('#city', {
  endpoint: '${endpoint}',
  minLength: 2,
  ${filter}
  getId: city => city.key,
  getLabel: city => \`\${city.name}, \${city.country}\`,
  getValue: city => city.name,
  onSelect: city => {
    document.querySelector('#selected').textContent = \`Selected \${city.name}.\`
  },
})`,
    },
  },
  {
    id: 'render',
    tab: 'Custom options',
    title: 'Render richer options',
    description:
      'renderOption receives each option button and its data, so you can add a secondary line without losing the accessible label.',
    files: {
      html: `<div class="field">
  <label for="destination">Destination</label>
  <input id="destination" type="text" />
</div>`,
      css: `${baseCss}
[data-autocomplete-option] small { display: block; color: #666; }`,
      js: `window.Autocomplete.create('#destination', {
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
})`,
    },
  },
  {
    id: 'events',
    tab: 'Events',
    title: 'React to selection and clearing',
    description:
      'The input dispatches autocomplete:select, autocomplete:clear, autocomplete:load and autocomplete:error, so the rest of the form can stay in sync.',
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

const controller = window.Autocomplete.create('#origin', {
  endpoint: '${endpoint}',
  ${filter}
  getId: city => city.key,
  getLabel: city => city.name,
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
] as const
