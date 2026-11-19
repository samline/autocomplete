import { setupPills } from './examples/behaviors/pills.js'
import { setupHooks } from './examples/behaviors/hooks.js'
import { setupPlugins } from './examples/behaviors/plugins.js'
import { setupState } from './examples/behaviors/state.js'
import { setupRendering } from './examples/behaviors/rendering.js'
import { setupHeadless } from './examples/behaviors/headless.js'
import { setupPalette } from './examples/behaviors/palette.js'
import { setupDependent } from './examples/behaviors/dependent.js'
import { project } from '../shared/lib/project.mjs'

// The browser bundle exposes the DOM controller only, so the CDN headless
// example imports the ESM core build published next to it, at the same version.
const coreModule = project.delivery.cdnScript.replace(
  /browser\/autocomplete\.global\.js$/,
  'core/index.js'
)
const endpoint = 'https://samline.github.io/autocomplete/cities.json'

// These setup functions have no module dependencies. Both the mounted preview
// and the copyable document run the same behavior, using only public APIs.
const script = (setup: Function, mode: 'cdn' | 'esm' = 'cdn') =>
  mode === 'esm'
    ? `import { autocomplete } from '@samline/autocomplete'\nimport '@samline/autocomplete/style.css'\nconst setup = ${setup.toString()}\nsetup(document, autocomplete)`
    : `const setup = ${setup.toString()}\nsetup(document, window.Autocomplete.autocomplete)`
const css = `[data-example] { display: grid; gap: .75rem; }
/* Forms lay out like the example root: actions never touch the fields. */
[data-example] form { display: grid; gap: .75rem; }
[data-example] .field { position: relative; }
[data-example] label { display: block; margin-bottom: .5rem; }
[data-example] input[type="text"] { box-sizing: border-box; width: 100%; padding: .75rem 1rem; border: 1px solid var(--color-border, #888); border-radius: .5rem; background: var(--color-bg-soft, #fff); color: inherit; font: inherit; }
[data-example] button { padding: .5rem .75rem; border: 1px solid var(--color-border, #888); border-radius: .5rem; background: var(--color-bg-soft, #fff); color: inherit; font: inherit; cursor: pointer; }
[data-example] button:focus-visible, [data-example] input:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
[data-example] p { margin: 0; overflow-wrap: anywhere; }
[data-example] .actions { display: flex; flex-wrap: wrap; gap: .5rem; }
[data-example] [data-pills] { display: flex; flex-wrap: wrap; gap: .375rem; margin: 0; padding: 0; list-style: none; }
[data-example] [data-pills]:empty { display: none; }
[data-example] .pill { display: flex; max-width: 100%; }
[data-example] .pill button { box-sizing: border-box; display: inline-flex; align-items: center; gap: .375rem; max-width: 100%; height: 2rem; padding: 0 .625rem; border: 1px solid var(--color-border, #888); border-radius: 1rem; background: var(--color-bg, #f4f4f5); color: inherit; font: inherit; font-size: .875rem; line-height: 1; overflow-wrap: anywhere; cursor: pointer; }
[data-example] .pill button:hover { background: var(--color-bg-soft, #e4e4e7); }
[data-example] .pill button svg { width: .875rem; height: .875rem; flex: none; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; opacity: .7; }
[data-example] .pill button:hover svg { opacity: 1; }
[data-example] .pill-field { display: flex; flex-wrap: wrap; align-items: center; gap: .375rem; box-sizing: border-box; min-height: 3.125rem; padding: .5rem .75rem; border: 1px solid var(--color-border, #888); border-radius: .5rem; background: var(--color-bg-soft, #fff); cursor: text; }
[data-example] .pill-field:focus-within { outline: 2px solid currentColor; outline-offset: 2px; }
[data-example] .pill-field input[type="text"] { flex: 1 1 8rem; width: auto; min-width: 0; height: 2rem; padding: 0; border: 0; background: transparent; }
[data-example] .pill-field input[type="text"]:focus-visible { outline: none; }
/* The popup sits after the whole field and overlays what follows it. */
[data-example="pills"] { --autocomplete-max-height: 10rem; }
[data-example="pills"] form { display: grid; gap: .5rem; }
[data-example="pills"] .field [data-autocomplete-popup] { position: absolute; top: 100%; }
/* One reserved pill row: switching layouts never shifts what follows. */
[data-example] [data-pills-below] { min-height: 2.25rem; }
[data-example] .layout { display: flex; flex-wrap: wrap; gap: .25rem; margin: 0; padding: .25rem; border: 1px solid var(--color-border, #888); border-radius: .625rem; justify-self: start; }
[data-example] .layout legend { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
[data-example] .layout label { position: relative; display: flex; align-items: center; margin: 0; padding: .375rem .75rem; border-radius: .375rem; font-size: .875rem; cursor: pointer; }
[data-example] .layout input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; pointer-events: none; }
[data-example] .layout label:has(:checked) { background: var(--color-bg-soft, #e4e4e7); box-shadow: inset 0 0 0 1px var(--color-border, #888); font-weight: 600; }
[data-example] .layout label:has(:focus-visible) { outline: 2px solid currentColor; outline-offset: 2px; }
[data-example] .directory { display: grid; gap: .5rem; padding: 0; margin: 0; list-style: none; }
[data-example] .directory button { width: 100%; text-align: left; }
[data-example] [aria-disabled="true"] { opacity: .65; }
[data-example] select { padding: .75rem 1rem; border: 1px solid var(--color-border, #888); border-radius: .5rem; background: var(--color-bg-soft, #fff); color: inherit; font: inherit; }
[data-example] input[type="text"]:disabled { opacity: .65; cursor: not-allowed; }
[data-example] [data-autocomplete-option] small { display: block; opacity: .75; }
[data-example] kbd { float: right; padding: 0 .375rem; border: 1px solid currentColor; border-radius: .25rem; font: .75rem/1.5 ui-monospace, monospace; opacity: .75; }`

export default [
  {
    id: 'pills',
    tab: 'Pills',
    title: 'Select several items as removable pills',
    description:
      'Switch where the pills live: inside the field next to the input, or in their own list below it. The suggestions always open below the whole field, because the example moves controller.popupElement after it. transformSuggestions hides chosen teams and each pill is submitted as a repeated teams[] field; this composes the single-selection API, it is not a built-in multiple mode. With an empty input, Backspace focuses the last pill, Delete removes it, arrows move between pills and Escape returns to typing.',
    files: {
      html: `<div data-example="pills">
  <fieldset class="layout">
    <legend>Show selected teams</legend>
    <label><input type="radio" name="pills-layout" value="inside" checked /> Inside the field</label>
    <label><input type="radio" name="pills-layout" value="below" /> Below the field</label>
  </fieldset>
  <form>
    <div class="field">
      <label for="pills-input">Teams</label>
      <div class="pill-field"><ul data-pills aria-label="Selected teams"></ul><input id="pills-input" type="text" aria-describedby="pills-help" placeholder="Add a team" /></div>
    </div>
    <div data-pills-below></div>
    <p id="pills-help">With no text, Backspace focuses the last pill and Delete removes it.</p>
    <div data-values></div>
    <p data-announcement role="status">No teams selected.</p>
    <div class="actions"><button type="submit">Submit teams</button><button type="reset">Reset teams</button></div>
    <p data-submitted aria-live="polite">Nothing submitted yet.</p>
  </form>
</div>`,
      css,
      js: script(setupPills),
      esm: script(setupPills, 'esm'),
    },
  },
  {
    id: 'hooks',
    tab: 'Hooks',
    title: 'Normalize, deduplicate and guard selections',
    description:
      'Type “#de” to strip the # before searching and see one Design result despite duplicate source records. Type “en” and try Enterprise: beforeSelect rejects it and keeps the list open. No source-specific behavior is added to the package.',
    files: {
      html: `<div data-example="hooks"><div class="field"><label for="hooks-input">Team</label><input id="hooks-input" type="text" placeholder="Try #de or en" /></div><p data-note role="status">Search with an optional # prefix.</p></div>`,
      css,
      js: script(setupHooks),
      esm: script(setupHooks, 'esm'),
    },
  },
  {
    id: 'plugins',
    tab: 'Plugins and cache',
    title: 'Observe cache hits through a reusable plugin',
    description:
      'The telemetry plugin listens to load events and cleans up with destroy. Search for “en”, repeat it to hit the cache, then clear the cache and repeat to call the async source again. max and ttl bound the cache.',
    files: {
      html: `<div data-example="plugins"><div class="field"><label for="plugins-input">Team directory</label><input id="plugins-input" type="text" placeholder="Try en" /></div><p data-requests>Source calls: 0</p><p data-note role="status">No searches yet.</p><div class="actions"><button type="button" data-repeat>Repeat search</button><button type="button" data-clear-cache>Clear cache</button></div></div>`,
      css,
      js: script(setupPlugins),
      esm: script(setupPlugins, 'esm'),
    },
  },
  {
    id: 'state',
    tab: 'State and prefill',
    title: 'Prefill an edit form and observe its state',
    description:
      'setValue restores a saved object and its hidden id without a selection event. subscribe updates the status display; getState supplies the initial snapshot. Editing the label clears the selected id, and destroy releases the subscription.',
    files: {
      html: `<div data-example="state"><form><div class="field"><label for="state-input">Assigned team</label><input id="state-input" type="text" /></div><div class="actions"><button type="button" data-prefill>Restore saved team</button><button type="button" data-clear>Clear team</button><button type="submit">Save assignment</button></div></form><p data-state role="status"></p><p data-submitted aria-live="polite">Nothing submitted yet.</p></div>`,
      css,
      js: script(setupState),
      esm: script(setupState, 'esm'),
    },
  },
  {
    id: 'rendering',
    tab: 'Status and content',
    title: 'Customize loading, empty and error states',
    description:
      'A simulated async directory makes loading visible. Search for “en” for results with a custom header and footer, “zzz” for an empty state, or enable Simulate failure and search again for an error. All content is rendered with textContent.',
    files: {
      html: `<div data-example="rendering"><div class="field"><label for="rendering-input">Team directory</label><input id="rendering-input" type="text" placeholder="Try en or zzz" /></div><label><input type="checkbox" /> Simulate failure</label></div>`,
      css,
      js: script(setupRendering),
      esm: script(setupRendering, 'esm'),
    },
  },
  {
    id: 'headless',
    tab: 'Headless',
    title: 'Render a directory with the search pipeline alone',
    description:
      'createSearch handles filtering while the application renders a persistent list of native buttons. Tab and Enter operate the results. This is a filterable directory, not a combobox: a custom combobox would also need application-owned ARIA and arrow-key behavior. The ESM version imports @samline/autocomplete/core; the CDN version loads that same module, since the browser bundle only exposes the controller.',
    files: {
      html: `<div data-example="headless"><label for="headless-input">Filter teams</label><input id="headless-input" type="text" /><p data-note role="status"></p><ul class="directory" data-results aria-label="Matching teams"></ul></div>`,
      css,
      js: `const setup = ${setupHeadless.toString()}\nimport('${coreModule}')\n  .then(({ createSearch }) => setup(document, createSearch))\n  .catch(() => { document.querySelector('[data-note]').textContent = 'Could not load the search module.' })`,
      esm: `import { createSearch } from '@samline/autocomplete/core'\nconst setup = ${setupHeadless.toString()}\nsetup(document, createSearch)`,
    },
  },
  {
    id: 'palette',
    tab: 'Command palette',
    title: 'Build a command palette with actions and pages',
    description:
      'Two local sections share a filter that also matches hidden keywords: “invoice” finds Billing and renderOption explains why. Shortcut hints and a footer are plain DOM nodes. The select event reports the section, the palette clears itself after each command and the last three picks return as Recent on an empty field.',
    files: {
      html: `<div data-example="palette"><div class="field"><label for="palette-input">Command</label><input id="palette-input" type="text" placeholder="Try new, invoice or theme" /></div><p data-output role="status">Nothing run yet.</p></div>`,
      css,
      js: script(setupPalette),
      esm: script(setupPalette, 'esm'),
    },
  },
  {
    id: 'dependent',
    tab: 'Dependent fields',
    title: 'Narrow one field by another',
    description:
      'The country select drives the city search through a function endpoint, so each request reads the current country. Because results are cached per query, changing the country calls clearCache and clear. minLength: 0 lists every city of the country on focus, and the form submits both values.',
    files: {
      html: `<div data-example="dependent" data-endpoint="${endpoint}"><form><div class="field"><label for="dependent-country">Country</label><select id="dependent-country" name="country"><option value="">Choose a country</option><option>Colombia</option><option>Mexico</option><option>Spain</option></select></div><div class="field"><label for="dependent-input">City</label><input id="dependent-input" type="text" disabled /></div><div class="actions"><button type="submit">Submit</button></div></form><p data-note role="status">Choose a country first.</p></div>`,
      css,
      js: script(setupDependent),
      esm: script(setupDependent, 'esm'),
    },
  },
] as const
