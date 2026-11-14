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
import '@samline/autocomplete/styles.css'

createAutocomplete('#city', {
  endpoint: '/api/cities',
  getId: city => city.id,
  getLabel: city => city.name,
  onSelect: city => console.log('Selected', city),
})`

export default {
  hero: {
    seoTitle: 'Accessible remote autocomplete',
    seoDescription:
      'An accessible, dependency-free remote autocomplete for vanilla JavaScript, TypeScript and plain HTML, with debounce and abortable requests.',
    kicker: 'Type. Pick. Done.',
    title: project.name,
    titleAccent: 'Search that feels right.',
    description:
      'Turn any text input into an accessible combobox that searches your endpoint, with debounce, cancellation and keyboard support built in.',
    descriptionContinuation:
      'Install it, search the live preview, then read the complete reference.',
    footnotes: ['Zero dependencies', 'ARIA combobox', `${project.license} licensed`],
    compatibilityLabel: 'Works with',
    platforms: ['Vanilla JS', 'TypeScript', 'Plain HTML', 'Any framework', 'Any backend'],
  },
  features: {
    eyebrow: '01 / More than a dropdown',
    title: 'Every detail handled.',
    titleAccent: 'Your data, your markup.',
    items: {
      endpoint: {
        title: 'Your endpoint, any shape',
        description: text(
          'Point it at a URL or a function of the query. mapResponse, getId, getLabel and getValue adapt whatever JSON your API returns.'
        ),
      },
      accessibility: {
        title: 'An accessible combobox',
        description: text(
          'ARIA combobox and listbox roles, aria-activedescendant and announced status messages, with Arrow keys, Home, End, Enter, Escape and Tab.'
        ),
      },
      requests: {
        title: 'No stale results',
        description: text(
          'Searches are debounced and superseded requests aborted. Closing the list cancels the pending search, so a late response never reopens it.'
        ),
      },
      delivery: {
        title: 'Package or script tag',
        description: text(
          'Import createAutocomplete as ESM or CommonJS, or load the browser bundle and call window.Autocomplete.create.'
        ),
      },
      events: {
        title: 'Events for the rest of the form',
        description: text(
          'autocomplete:select, clear, loadstart, load and error bubble from the input, so hidden fields and other UI stay in sync.'
        ),
      },
      styling: {
        title: 'Styled with variables',
        description: text(
          'An optional stylesheet themed with CSS custom properties. Your label and input markup stay yours.'
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
        description: 'createAutocomplete, the response helpers and types, as ESM or CommonJS.',
      },
      global: {
        label: 'HTML / CDN',
        entrypoint: 'window.Autocomplete',
        description:
          'create(), destroy() and the available registry, keyed by input id, for pages without a build step.',
      },
      controller: {
        label: 'Controller',
        entrypoint: 'createAutocomplete(input, options)',
        description:
          'Renders the listbox after your input and returns search(), close(), clear(), cancel() and getSelected().',
      },
      cleanup: {
        label: 'Cleanup',
        entrypoint: 'controller.destroy()',
        description: 'Aborts pending work, removes the list and listeners, and restores the input.',
      },
      types: {
        label: 'Types',
        entrypoint: 'AutocompleteOptions<T>',
        description: 'Typed options, controller and event details for your own suggestion type.',
      },
      style: {
        label: 'Styles',
        entrypoint: `${project.npmName}/styles.css`,
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
    fullExampleLabel: 'Copy complete working files',
    markupDescription:
      'Keep your label and input. The wrapper needs position: relative so the list can sit under the field.',
    examples: {
      markup: code('index.html', markup, 'html'),
      script: code('main.js', script, 'javascript'),
    },
    docs: {
      description: 'Continue with every option, the controller and the events.',
      label: 'Explore the options',
    },
  },
  recipes: {
    eyebrow: '04 / Beyond the first search',
    title: 'Adapt any API.',
    titleAccent: 'Keep the form in sync.',
    description: 'Three common integrations, built from the same options and events.',
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
        title: 'Store the selected id',
        context: 'Events',
        docsRoute: 'api' as const,
        docsLabel: 'Read the API',
        description: text('Keep a hidden field with the id while the input shows the label.'),
        code: code(
          'main.js',
          `const input = document.querySelector('#city')\nconst hidden = document.querySelector('#city-id')\n\ninput.addEventListener('autocomplete:select', event => {\n  hidden.value = event.detail.suggestion.id\n})\ninput.addEventListener('autocomplete:clear', () => (hidden.value = ''))`,
          'javascript'
        ),
      },
      {
        title: 'Send headers and handle errors',
        context: 'requestInit',
        docsRoute: 'options' as const,
        docsLabel: 'Read the options',
        description: text('Add authentication headers and report failures your own way.'),
        code: code(
          'main.js',
          `createAutocomplete('#city', {\n  endpoint: '/api/cities',\n  requestInit: { headers: { Authorization: \`Bearer \${token}\` } },\n  onError: error => report(error),\n})`,
          'javascript'
        ),
      },
    ],
  },
  faq: {
    eyebrow: '05 / Before you build',
    heading: heading('A few details.', 'Clearly answered.'),
    items: {
      docs: {
        question: text('Does it work with my backend?'),
        answer: text(
          'Yes. It calls any URL or function you provide and lets mapResponse read whatever JSON comes back. Filtering and ranking stay on your server.'
        ),
      },
      copy: {
        question: text('Can I use it without a bundler?'),
        answer: text(
          'Yes. Load dist/browser/global.global.js and dist/styles.css from a CDN and call window.Autocomplete.create. Pin the version in production.'
        ),
      },
      changes: {
        question: text('How are releases documented?'),
        answer: text(
          'CHANGELOG.md is the single release history and is published in the docs. Breaking and behavior changes are called out explicitly.'
        ),
      },
      keyboard: {
        question: text('Which keys are supported?'),
        answer: text(
          'ArrowUp and ArrowDown move through options, Home and End jump to the first and last, Enter selects, and Escape or Tab close the list.'
        ),
      },
      stale: {
        question: text('What happens to slow responses?'),
        answer: text(
          'Each new search aborts the previous request and older responses are ignored. Closing the list also cancels the pending search.'
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
        answer: text(
          'Override the --autocomplete-* custom properties or target [data-autocomplete-list] and [data-autocomplete-option]. renderOption adds your own content to each option.'
        ),
      },
      cleanup: {
        question: text('How do I remove it?'),
        answer: text(
          'Call controller.destroy(). It aborts any request, removes the list and listeners, and restores the input attributes it changed.'
        ),
      },
    },
  },
  callToAction: {
    eyebrow: 'Search your users can rely on',
    heading: heading('Make every search', 'feel instant.'),
    description: 'Follow the first steps, or read the source on GitHub.',
    docs: {
      description: 'Guides, the complete API and release notes, in one place.',
      label: 'Read the documentation',
    },
  },
} as const
