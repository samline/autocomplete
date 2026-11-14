# AGENTS

## Package contract

`@samline/autocomplete` is framework- and provider-agnostic. Do not add Laravel, Alpine, React, Vue, Astro, Next.js, mapping-provider, or endpoint-specific behavior to core.

## Architecture

Mirror the sibling `@samline` packages (`../ticker` is the closest reference).

- `src/constants.ts`: defaults and data-attribute names.
- `src/core/`: DOM-free contracts and helpers (types, validation, sources, cache, text matching and highlighting).
- `src/vanilla/`: the DOM controller (`autocomplete` / `createAutocomplete`) and DOM helpers.
- `src/browser/`: the shared registry (`newAutocomplete`, `getAutocomplete`, `getAutocompletes`, `destroyAutocomplete`, `destroyAutocompletes`, `available`), its module entrypoint and the `window.Autocomplete` IIFE entrypoint (`global.ts`).
- `src/index.ts`: side-effect-free package entrypoint.
- `src/styles.css`: optional data-attribute-driven styles.
- `test/`: Vitest + jsdom contracts.
- `docs/`: public API and integration documentation.
- `example/`: direct-browser example consuming `dist/`.

## Rules

- Query codebase-memory before code discovery; index this project after structural changes.
- Keep the root entrypoint side-effect free.
- No classes: arrow functions and closures by default, no `this`.
- Keep response shape configurable through adapters.
- Never render endpoint content with `innerHTML`; use `textContent` or consumer-owned DOM callbacks.
- Preserve WAI-ARIA combobox/listbox behavior and keyboard operation.
- Any public API change must update tests, README, and `docs/` in the same change.
- One license file: `LICENSE.md` (MIT, `Copyright (c) 2026 Samuel Olvera (samline)`), covering the package and the website. Add `SITE-LICENSE.md` only if the site theme ever uses a different license.
- Run `bun run build`, `bun run typecheck`, `bun run test`, `bun run format:check`, and `npm pack --dry-run` before release. Use `bun run test`, not Bun's native `bun test`, because the suite depends on Vitest's jsdom configuration.
