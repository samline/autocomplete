import { project } from '../../../../../shared/lib/project.mjs'
const text = (value: string) => [{ kind: 'text' as const, value }]
const heading = (prefix: string, accent: string) => [
  { kind: 'text' as const, value: prefix + ' ' },
  { kind: 'emphasis' as const, value: accent },
]
const code = (filename: string, source: string, language: 'html' | 'javascript' | 'bash') => ({
  filename,
  code: source,
  language,
})

const markup = `<div class="field" style="position: relative">
  <label for="city">City</label>
  <input id="city" type="text">
</div>`

const script = `import { createAutocomplete } from '@samline/autocomplete'
import '@samline/autocomplete/style.css'

createAutocomplete('#city', {
  endpoint: '/api/cities',
  getId: city => city.id,
  getLabel: city => city.name,
  onSelect: city => console.log('Selected', city),
})`

export default {
  hero: {
    seoTitle: 'Accessible autocomplete for any source',
    seoDescription:
      'An accessible, dependency-free autocomplete for JavaScript, TypeScript and plain HTML: endpoints, local lists, sections, recent searches and headless search.',
    kicker: 'Type. Pick. Done.',
    title: project.name,
    titleAccent: 'Search that feels right.',
    description:
      'Turn any text input into an accessible combobox over your endpoint, a function or a local list, with sections, recent searches, debounce and cancellation built in.',
    descriptionContinuation: 'Cities, commands or people. Your data, one keystroke away.',
    footnotes: ['Zero dependencies', 'TypeScript ready', `${project.license} licensed`],
    compatibilityLabel: 'ONE SMALL SCRIPT. RIGHT AT HOME IN YOUR STACK.',
    platforms: [
      'JavaScript',
      'TypeScript',
      'React',
      'Vue',
      'Svelte',
      'Astro',
      'Shopify',
      'WordPress',
    ],
  },
  features: {
    eyebrow: '01 / More than a dropdown',
    title: 'Every detail handled.',
    titleAccent: 'Your data, your markup.',
    items: {
      endpoint: {
        title: 'Any source, any shape',
        description: text(
          'A URL, an async function or a local array, or several at once as labelled sections. mapResponse, getId, getLabel and getValue adapt whatever shape your data has.'
        ),
      },
      accessibility: {
        title: 'An accessible combobox',
        description: text(
          'ARIA combobox and listbox roles, labelled groups for sections, aria-activedescendant and a live region that announces results, with Arrow keys, Home, End, Enter, Escape and Tab.'
        ),
      },
      requests: {
        title: 'No stale results',
        description: text(
          'Searches are debounced, superseded requests aborted and results cached per query. If one section fails, the others still show. Closing the list cancels the pending search.'
        ),
      },
      delivery: {
        title: 'Package, script tag or attributes',
        description: text(
          'Import createAutocomplete as ESM or CommonJS, or load the browser bundle: it mounts every input[data-autocomplete] without writing JavaScript.'
        ),
      },
      events: {
        title: 'State, hooks and plugins',
        description: text(
          'subscribe(), on() and bubbling DOM events keep your framework and form in sync. beforeSearch, transformSuggestions, beforeSelect and plugins reshape every step.'
        ),
      },
      styling: {
        title: 'Styled with variables',
        description: text(
          'An optional stylesheet themed with CSS custom properties, highlighted matches, and a list that flips above the field or joins the top layer as a popover.'
        ),
      },
    },
  },
  runtimes: {
    eyebrow: '02 / Fit it into your stack',
    heading: heading('Two ways in.', 'One controller.'),
    description:
      'Import the package with a bundler or load the browser bundle with a script tag; both return the same controller.',
    items: {
      package: {
        label: 'Package / ESM',
        entrypoint: project.npmName,
        description:
          'createAutocomplete, createSearch for headless rendering, the source, cache, recent and highlight helpers and types, as ESM or CommonJS.',
      },
      global: {
        label: 'HTML / CDN',
        entrypoint: 'window.Autocomplete',
        description:
          'Mounts input[data-autocomplete] on load and as inputs appear, plus newAutocomplete(), getAutocomplete() and destroyAutocomplete() keyed by input id.',
      },
      controller: {
        label: 'Controller',
        entrypoint: 'createAutocomplete(input, options)',
        description:
          'Renders the popup after your input and returns search(), setValue(), getState(), subscribe(), on(), close(), clear() and more.',
      },
      cleanup: {
        label: 'Cleanup',
        entrypoint: 'controller.destroy()',
        description:
          'Aborts pending work, removes the popup and listeners, and restores the input.',
      },
      types: {
        label: 'Types',
        entrypoint: 'AutocompleteOptions<T>',
        description: 'Typed options, controller and event details for your own suggestion type.',
      },
      style: {
        label: 'Styles',
        entrypoint: `${project.npmName}/style.css`,
        description: 'Optional stylesheet; theme it with --autocomplete-* custom properties.',
      },
    },
  },
  gettingStarted: {
    eyebrow: '03 / Install and search',
    heading: heading('One install.', 'One working search.'),
    integrationDescription: 'Attach the combobox to an input and point it at your endpoint.',
    integrationLabel: 'Read the installation guide',
    steps: { install: 'Install', markup: 'Add markup', initialize: 'Create the autocomplete' },
    installLabel: 'Installation method',
    installTabs: [],
    initLabel: 'Example format',
    initTabs: [
      { id: 'script', label: 'Package / ESM' },
      { id: 'complete', label: 'HTML / CDN' },
    ],
    cdnHint:
      'Load the CDN stylesheet and script from step 1, then load this file with defer after the runtime script.',
    fullExampleLabel: 'Copy complete working files',
    markupDescription:
      'Keep your label and input. The wrapper needs position: relative so the list can sit under the field.',
    examples: {
      markup: code('index.html', markup, 'html'),
      script: code('main.js', script, 'javascript'),
      complete: code(
        'main.js',
        script
          .replace(/import[^\n]*\n/g, '')
          .replace(/\n  (\w)/g, '\n    $1')
          .replace(
            "createAutocomplete('#city', {",
            "window.Autocomplete.newAutocomplete({\n  id: 'city',\n  options: {"
          )
          .replace(/\n}\)$/, '\n  },\n})')
          .trim(),
        'javascript'
      ),
    },
    docs: {
      description: 'Continue with every option, the controller, hooks and events.',
      label: 'Explore the options',
    },
  },
  recipes: {
    eyebrow: '04 / Beyond the first search',
    title: 'Adapt any API.',
    titleAccent: 'Keep the form in sync.',
    description:
      'Three common integrations, built from the same options. More in the recipes guide.',
    examplesLabel: 'Explore working examples',
    items: [
      {
        title: 'Map any response',
        context: 'mapResponse',
        docsRoute: 'options' as const,
        docsLabel: 'Read the options',
        description: text('Turn your API payload into a list of suggestions.'),
        code: code(
          'main.js',
          `createAutocomplete('#city', {\n  endpoint: query => \`/api/search?term=\${encodeURIComponent(query)}\`,\n  queryParam: null,\n  mapResponse: payload => payload.data.items,\n  getLabel: item => item.title,\n})`,
          'javascript'
        ),
      },
      {
        title: 'Submit the selected id',
        context: 'hiddenInput',
        docsRoute: 'options' as const,
        docsLabel: 'Read the options',
        description: text('The input shows the label while a hidden field submits the id.'),
        code: code(
          'main.js',
          `const city = createAutocomplete('#city', {\n  endpoint: '/api/cities',\n  getId: city => city.id,\n  getLabel: city => city.name,\n  hiddenInput: 'city_id',\n})\n\n// Editing a saved record:\ncity.setValue({ id: 42, name: 'Guadalajara' })`,
          'javascript'
        ),
      },
      {
        title: 'Build a command palette',
        context: 'sections',
        docsRoute: 'recipes' as const,
        docsLabel: 'Read the recipes',
        description: text('Group several sources under labels and bring back recent picks.'),
        code: code(
          'main.js',
          `createAutocomplete('#palette', {\n  sections: [\n    { id: 'actions', label: 'Actions', source: actions },\n    { id: 'pages', label: 'Pages', source: query => searchPages(query) },\n  ],\n  minLength: 1,\n  recent: true,\n  popover: true,\n})`,
          'javascript'
        ),
      },
    ],
  },
  faq: {
    eyebrow: '05 / Before you build',
    heading: heading('A few details.', 'Clearly answered.'),
    items: {
      backend: {
        question: text('Does it work with my backend?'),
        answer: [
          { kind: 'text', value: 'Yes. It requests any URL or function you provide, adding ' },
          { kind: 'code', value: '?q=<query>' },
          { kind: 'text', value: ' by default, and ' },
          { kind: 'code', value: 'mapResponse' },
          {
            kind: 'text',
            value:
              ' reads whatever JSON comes back. No endpoint? Pass a source: any async function, or a local array filtered in the browser without regard to case or accents.',
          },
        ],
      },
      noBundler: {
        question: text('Does it work without a bundler?'),
        answer: [
          {
            kind: 'text',
            value:
              'Yes. The HTML / CDN script mounts every input with a data-autocomplete attribute, in plain HTML, WordPress or Shopify: ',
          },
          { kind: 'code', value: '<input data-autocomplete="/api/cities">' },
          {
            kind: 'text',
            value: ' is a working search. Pin the version in production.',
          },
        ],
      },
      frameworks: {
        question: text('Can I use it with React, Vue or Svelte?'),
        answer: [
          { kind: 'text', value: 'Yes. Pass the mounted input from a ref to ' },
          { kind: 'code', value: 'createAutocomplete()' },
          { kind: 'text', value: ', read its state with ' },
          { kind: 'code', value: 'subscribe()' },
          { kind: 'text', value: ' and ' },
          { kind: 'code', value: 'getState()' },
          { kind: 'text', value: ', which fit React’s useSyncExternalStore, and call ' },
          { kind: 'code', value: 'destroy()' },
          {
            kind: 'text',
            value: ' on unmount. There is no adapter to install and no peer dependency to ship.',
          },
        ],
      },
      headless: {
        question: text('Can I render the results myself?'),
        answer: [
          { kind: 'text', value: 'Yes. ' },
          { kind: 'code', value: 'createSearch()' },
          {
            kind: 'text',
            value:
              ' runs the same pipeline without any DOM: sources, sections, local filtering, caching and partial failures. You render the results and own the ARIA and keyboard support.',
          },
        ],
      },
      accessibility: {
        question: text('How does it handle accessibility?'),
        answer: [
          { kind: 'text', value: 'The input becomes an ARIA ' },
          { kind: 'code', value: 'combobox' },
          { kind: 'text', value: ' that controls a ' },
          { kind: 'code', value: 'listbox' },
          {
            kind: 'text',
            value:
              '. ArrowUp and ArrowDown move through options, Home and End jump to the ends, Enter selects, and Escape or Tab close the list. Result counts, empty results and errors are announced through a live region. Your page supplies the visible label.',
          },
        ],
      },
      stale: {
        question: text('What happens to slow responses?'),
        answer: text(
          'Each new search aborts the previous request and older responses are ignored. Closing the list also cancels the pending search, so a late response never reopens it.'
        ),
      },
      ime: {
        question: text('Does it handle Japanese, Chinese or Korean input?'),
        answer: text(
          'Yes. While an IME composition is in progress it waits, and searches once the composition ends.'
        ),
      },
      styling: {
        question: text('How do I change how it looks?'),
        answer: [
          { kind: 'text', value: 'Override the ' },
          { kind: 'code', value: '--autocomplete-*' },
          { kind: 'text', value: ' custom properties or target ' },
          { kind: 'code', value: '[data-autocomplete-popup]' },
          { kind: 'text', value: ' and ' },
          { kind: 'code', value: '[data-autocomplete-option]' },
          { kind: 'text', value: ', and matches through ' },
          { kind: 'code', value: '[data-autocomplete-highlight]' },
          { kind: 'text', value: '. ' },
          { kind: 'code', value: 'renderOption' },
          {
            kind: 'text',
            value: ' appends your own DOM nodes to each option, never HTML strings.',
          },
        ],
      },
      cleanup: {
        question: text('Should I close it or destroy it?'),
        answer: [
          { kind: 'code', value: 'close()' },
          {
            kind: 'text',
            value:
              ' hides the list and cancels the pending search; the controller stays usable. Call ',
          },
          { kind: 'code', value: 'destroy()' },
          {
            kind: 'text',
            value:
              ' when the input leaves the page: it aborts any request, removes the list and listeners, and restores the input attributes it changed.',
          },
        ],
      },
      bundleSize: {
        question: text('How big is the bundle?'),
        answer: [
          {
            kind: 'text',
            value: 'The browser IIFE build is approximately ',
          },
          { kind: 'strong', value: '12 KiB gzipped' },
          { kind: 'text', value: ', plus ' },
          { kind: 'strong', value: '0.8 KiB gzipped' },
          {
            kind: 'text',
            value: ' for the optional stylesheet. There are zero runtime dependencies.',
          },
        ],
      },
    },
  },
  callToAction: {
    eyebrow: 'Search your users can rely on',
    heading: heading('Make every search', 'feel instant.'),
    description: 'Follow the first steps, or read the source on GitHub.',
    docs: {
      description: `Installation, practical guides and the complete API for ${project.name} ${project.version}.`,
      label: 'Read the documentation',
    },
  },
} as const
