# @samline/autocomplete

An accessible, framework-agnostic remote autocomplete (combobox) for vanilla JavaScript, TypeScript and plain HTML. Point an input at your endpoint; debounce, cancellation, keyboard navigation, events and cleanup are handled for you.

[Demo](https://samline.github.io/autocomplete/) · [Examples](https://samline.github.io/autocomplete/examples/) · [Documentation](https://samline.github.io/autocomplete/docs/) · [Changelog](CHANGELOG.md)

## Table of contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [HTML / CDN](#html--cdn)
- [Capabilities](#capabilities)
- [API at a glance](#api-at-a-glance)
- [Documentation](#documentation)
- [Changelog](#changelog)
- [AI agent skill](#ai-agent-skill)
- [License](#license)

## Installation

```sh
npm install @samline/autocomplete
```

```sh
pnpm add @samline/autocomplete
```

```sh
bun add @samline/autocomplete
```

Works in modern browsers with `fetch` and `AbortController`, and imports in Node 20 or newer. No runtime dependencies; the stylesheet is optional.

## Quick start

```html
<div class="field" style="position: relative">
  <label for="city">City</label>
  <input id="city" type="text" />
</div>
```

```js
import { createAutocomplete } from '@samline/autocomplete'
import '@samline/autocomplete/styles.css'

const controller = createAutocomplete('#city', {
  endpoint: '/api/cities', // GET /api/cities?q=<query>
  getId: city => city.id,
  getLabel: city => city.name,
  onSelect: city => console.log('Selected', city),
})

controller.destroy() // removes the list and restores the input
```

## HTML / CDN

For Shopify, WordPress or plain HTML pages without a build step, load the stylesheet and the browser bundle. Pin the version in production.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@samline/autocomplete@1.0.0/dist/styles.css" />
<script src="https://cdn.jsdelivr.net/npm/@samline/autocomplete@1.0.0/dist/browser/global.global.js"></script>
<script>
  window.Autocomplete.create('#city', { endpoint: '/api/cities' })
</script>
```

`window.Autocomplete` has `create(target, options)` (requires an input id and registers the controller), `destroy(id)`, `available` and `autocomplete(target, options)`.

## Capabilities

### Any endpoint, any response

`endpoint` is a URL or a function of the query. `requestInit` adds headers or credentials, `parseResponse` replaces JSON parsing, and `mapResponse`, `getId`, `getLabel` and `getValue` adapt whatever your API returns.

### An accessible combobox

ARIA `combobox` and `listbox` roles, `aria-expanded` and `aria-activedescendant`, status and error messages, and ArrowUp, ArrowDown, Home, End, Enter, Escape and Tab. Searches wait for IME composition to finish.

### No stale results

Searches are debounced, superseded requests are aborted and late responses ignored. Closing the list (Escape, Tab, clicking outside, selecting or `close()`) cancels the pending search.

### Events and styling

`autocomplete:select`, `autocomplete:clear`, `autocomplete:load`, `autocomplete:loadstart` and `autocomplete:error` bubble from the input. The optional stylesheet is themed with `--autocomplete-*` custom properties, and `renderOption` adds your own content to each option.

## API at a glance

| API | Purpose |
| --- | --- |
| `createAutocomplete(input, options)` | Attach the combobox and return a controller (`autocomplete` is an alias). |
| `controller.search(query?)` / `close()` / `clear()` / `cancel()` | Run a search now, close the list, clear everything or cancel pending work. |
| `controller.getSelected()` / `destroy()` | Read the selected suggestion or remove the combobox. |
| `mapCommonResponse`, `parseJsonResponse` | The default response mapper and parser. |

### Entrypoints

| Entrypoint | When to use |
| --- | --- |
| `@samline/autocomplete` | ESM or CommonJS: `createAutocomplete`, helpers, `browser` registry and types. |
| `@samline/autocomplete/browser` | Classic script that defines `window.Autocomplete`. |
| `@samline/autocomplete/styles.css` | Optional base stylesheet. |

## Documentation

Read the [documentation](https://samline.github.io/autocomplete/docs/) for the full guides and API contracts, and explore [working examples](https://samline.github.io/autocomplete/examples/) with complete and separate source files.

| Guide | What it covers |
| --- | --- |
| [Installation](https://samline.github.io/autocomplete/docs/getting-started/) | Package / ESM, HTML / CDN and working starter files. |
| [Options](https://samline.github.io/autocomplete/docs/reference/configuration/) | Every option and its default. |
| [API reference](https://samline.github.io/autocomplete/docs/reference/api/) | The controller, helpers, browser global and events. |
| [Accessibility](https://samline.github.io/autocomplete/docs/guides/accessibility/) | What the combobox provides and what your page provides. |
| [Styling](https://samline.github.io/autocomplete/docs/guides/styling/) | The DOM contract and the custom properties. |

## Changelog

Read [CHANGELOG.md](CHANGELOG.md) or the [published changelog](https://samline.github.io/autocomplete/docs/changelog/) for release history and explicitly marked breaking and behavior changes. Review the notes before upgrading.

## AI agent skill

The [Autocomplete skill](https://samline.github.io/autocomplete/skills/autocomplete/SKILL.md) teaches verified package integration. Its maintained [repository source](skills/autocomplete/SKILL.md) and website download are the same file. Verify the installed package version before applying its guidance.

Download [SKILL.md](https://samline.github.io/autocomplete/skills/autocomplete/SKILL.md) into an `autocomplete/` folder in your agent's supported skill directory. For agents that discover project skills from `.agents/skills/`:

```sh
mkdir -p .agents/skills/autocomplete
curl --fail --location https://samline.github.io/autocomplete/skills/autocomplete/SKILL.md \
  --output .agents/skills/autocomplete/SKILL.md
```

When working from this repository, copy `skills/autocomplete/SKILL.md` instead. Keep the filename `SKILL.md`; discovery paths and invocation syntax depend on the agent.

## License

MIT — [LICENSE.md](LICENSE.md).
