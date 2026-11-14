import { setupPills } from './examples/behaviors/pills.js'
import { setupHooks } from './examples/behaviors/hooks.js'
import { setupPlugins } from './examples/behaviors/plugins.js'
import { setupState } from './examples/behaviors/state.js'
import { setupRendering } from './examples/behaviors/rendering.js'
import { setupHeadless } from './examples/behaviors/headless.js'

// These setup functions have no module dependencies. Both the mounted preview
// and the copyable document run the same behavior, using only public APIs.
const script = (setup: Function) =>
  `const setup = ${setup.toString()}\nsetup(document, window.Autocomplete.autocomplete)`
const css = `[data-example] { display: grid; gap: .75rem; max-width: 32rem; }
[data-example] .field { position: relative; }
[data-example] label { display: block; margin-bottom: .5rem; }
[data-example] input[type="text"] { box-sizing: border-box; width: 100%; padding: .75rem 1rem; border: 1px solid var(--color-border, #888); border-radius: .5rem; background: var(--color-bg-soft, #fff); color: inherit; font: inherit; }
[data-example] button { padding: .5rem .75rem; border: 1px solid var(--color-border, #888); border-radius: .5rem; background: var(--color-bg-soft, #fff); color: inherit; font: inherit; cursor: pointer; }
[data-example] button:focus-visible, [data-example] input:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
[data-example] p { margin: 0; overflow-wrap: anywhere; }
[data-example] .actions { display: flex; flex-wrap: wrap; gap: .5rem; }
[data-example] [data-pills] { display: flex; flex-wrap: wrap; gap: .5rem; margin: 0; padding: 0; list-style: none; }
[data-example] .pill { display: inline-flex; align-items: center; gap: .25rem; padding-left: .75rem; border: 1px solid var(--color-border, #888); border-radius: 2rem; overflow-wrap: anywhere; max-width: 100%; }
[data-example] .pill button { border: 0; border-radius: 2rem; min-width: 2.75rem; min-height: 2.75rem; }
[data-example] .pill-field { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; padding: .5rem; border: 1px solid var(--color-border, #888); border-radius: .5rem; }
[data-example] .pill-field:focus-within { outline: 2px solid currentColor; outline-offset: 3px; }
[data-example] .pill-field input[type="text"] { width: auto; flex: 1 1 8rem; min-width: 0; border: 0; }
[data-example] .pill-field input[type="text"]:focus-visible { outline: none; }
[data-example] .directory { display: grid; gap: .5rem; padding: 0; margin: 0; list-style: none; }
[data-example] .directory button { width: 100%; text-align: left; }
[data-example] [aria-disabled="true"] { opacity: .65; }`

const pills = (inline: boolean) => {
  const id = inline ? 'pills-inline' : 'pills-external'
  const list = '<ul data-pills aria-label="Selected teams"></ul>'
  const input = `<input id="${id}-input" type="text" aria-describedby="${id}-help" />`
  return {
    id,
    tab: inline ? 'Inline pills' : 'External pills',
    title: inline ? 'Build a field with removable pills' : 'Collect selections as pills elsewhere',
    description: inline
      ? 'Pills and a real input share a visual field. With an empty input, Backspace or ← focuses the last pill; Backspace/Delete removes it, arrows move between pills and Escape returns to typing. The application owns the selection collection.'
      : 'Select several teams, remove any pill and submit repeated teams[] fields. onSelect collects selections, clear prepares the next search and transformSuggestions hides selected teams. This recipe uses the single-selection API; it is not a built-in multiple mode.',
    files: {
      html: `<form data-example="${id}" data-inline="${inline}">
  <div class="field">
    <label for="${id}-input">Teams</label>
    ${inline ? `<div class="pill-field">${list}${input}</div>` : input}
  </div>
  <p id="${id}-help">${inline ? 'Type to add teams. With no text, press Backspace to focus the last pill, then Delete to remove it.' : 'Choose teams from the list. Selected teams appear below.'}</p>
  ${inline ? '' : list}
  <div data-values></div>
  <p data-announcement role="status">No teams selected.</p>
  <div class="actions"><button type="submit">Submit teams</button><button type="reset">Reset teams</button></div>
  <p data-submitted aria-live="polite">Nothing submitted yet.</p>
</form>`,
      css,
      js: script(setupPills),
    },
  }
}

export default [
  pills(false),
  pills(true),
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
    },
  },
  {
    id: 'headless',
    tab: 'Headless',
    title: 'Render a directory with the search pipeline alone',
    description:
      'createSearch handles filtering while the application renders a persistent list of native buttons. Tab and Enter operate the results. This is a filterable directory, not a combobox: a custom combobox would also need application-owned ARIA and arrow-key behavior. The copyable code imports the public ESM core entrypoint.',
    files: {
      html: `<div data-example="headless"><label for="headless-input">Filter teams</label><input id="headless-input" type="text" /><p data-note role="status"></p><ul class="directory" data-results aria-label="Matching teams"></ul></div>`,
      css,
      js: `const setup = ${setupHeadless.toString()}\nimport('https://cdn.jsdelivr.net/npm/@samline/autocomplete@2.2.0/dist/core/index.js')\n  .then(({ createSearch }) => setup(document, createSearch))\n  .catch(() => { document.querySelector('[data-note]').textContent = 'Could not load the search module.' })`,
    },
  },
] as const
