# AGENTS

## Package contract

`@samline/autocomplete` is framework- and provider-agnostic. Do not add Laravel, Alpine, React, Vue, Astro, Next.js, mapping-provider, or endpoint-specific behavior to core.

## Architecture

- `src/core/`: DOM/runtime implementation and public contracts.
- `src/api/`: public named factories.
- `src/browser/`: registry and `window.Autocomplete` IIFE entrypoint.
- `src/index.ts`: side-effect-free package entrypoint.
- `src/styles.css`: optional data-attribute-driven styles.
- `test/`: Vitest + jsdom contracts.
- `docs/`: public API and integration documentation.
- `example/`: direct-browser example consuming `dist/`.

## Rules

- Query codebase-memory before code discovery; index this project after structural changes.
- Keep the root entrypoint side-effect free.
- Keep response shape configurable through adapters.
- Never render endpoint content with `innerHTML`; use `textContent` or consumer-owned DOM callbacks.
- Preserve WAI-ARIA combobox/listbox behavior and keyboard operation.
- Any public API change must update tests, README, and `docs/` in the same change.
- Run `bun run build`, `bun run typecheck`, `bun run test`, `bun run format:check`, and `npm pack --dry-run` before release. Use `bun run test`, not Bun's native `bun test`, because the suite depends on Vitest's jsdom configuration.
