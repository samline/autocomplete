# AGENTS

## Package contract

`@samline/autocomplete` is framework- and provider-agnostic. Do not add Laravel, Alpine, React, Vue, Astro, Next.js, mapping-provider, or endpoint-specific behavior to core.

## Architecture

Mirror the sibling `@samline` packages (`../ticker` is the closest reference).

- `src/constants.ts`: defaults and data-attribute names.
- `src/core/`: DOM-free contracts and helpers (types, validation, sources, the `createSearch` pipeline, cache, recent store, text matching and highlighting).
- `src/vanilla/`: the DOM controller (`autocomplete` / `createAutocomplete`), positioning, dataset parsing and DOM helpers.
- `src/browser/`: the shared registry (`newAutocomplete`, `getAutocomplete`, `getAutocompletes`, `destroyAutocomplete`, `destroyAutocompletes`, `available`), the declarative `mount()`, its module entrypoint and the `window.Autocomplete` IIFE entrypoint (`global.ts`, which mounts on load).
- `src/index.ts`: side-effect-free package entrypoint.
- `src/style.css`: optional data-attribute-driven styles.
- `test/`: Vitest + jsdom contracts.
- `docs/`: public API and integration documentation.
- `site/`: interactive previews and copyable examples.
- `tests/e2e/`: browser contracts against `dist/`.

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

## pnpm migration and 3.0.0 — 2026-11-15

- Installs with pnpm (`pnpm-workspace.yaml` lists landing, docs and shared); every script runs with `bun run`. Site scripts call `bun run --cwd <app>`; `site-tools/test-adaptation.mjs` links each app's own `node_modules` into the isolated copy.
- 3.0.0 renames: the stylesheet source is `src/style.css`; tsup writes `dist/style.css` and the alias `dist/styles.css`. The IIFE is `dist/browser/autocomplete.global.js`, with `global.global.js` as an identical alias. Browser entries export named members only (no `default`).
- `content-audit.json` records sha256 hashes of reviewed sources; refresh them after reviewing a change or `bun run site:check:release` fails.
- The site checks and the package smoke test run in `.github/workflows/site.yml`; the managed `ci.yml` only runs the family checks.

<!-- samline:family:start -->

## Family conventions (@samline)

This block is synced from the template that owns the family conventions ([package-landing-docs](https://github.com/samline/package-landing-docs) `family/AGENTS.md`, `node family/scripts/sync.mjs`). Do not edit it here; change the template and re-sync. The skill `.agents/skills/samline-package/SKILL.md` carries the full rules for a repository cloned on its own.

- One package per repository. Framework-agnostic core in JS/CSS/HTML; adapters only when idiomatic, as optional peers.
- No DOM access at import time; without a DOM, calls are no-ops. Respect `prefers-reduced-motion`; content stays visible without JavaScript.
- Arrow functions and closures, no classes or `this`. `destroy()` is idempotent and restores markup.
- Zero runtime dependencies: shared primitives (`@samline/internal`, `@samline/is-visible`, `@samline/debounce`) are devDependencies bundled with `noExternal`.
- Install with pnpm, run with Bun: `pnpm install` / `pnpm add -D` (only `pnpm-lock.yaml` is committed), `bun run <script>` for everything else. Never `bun install`, `bun add`, `npm install` or `yarn`.
- Packages talk through npm only: install the published version of any sibling package. Never link or import a local checkout (`bun link`, `link:`, `file:`, path aliases, `../other-package/src`).
- Layout: `src/core`, `src/vanilla`, `src/browser/global.ts` (`window.<PascalName>`, or a plain non-colliding name such as `Strings` when that is a built-in, never a `Samline` prefix; `dist/browser/<name>.global.js`), side-effect-free `src/index.ts`. Every public entry has a gzip budget in `package.json` → `size`.
- `bun run check` must pass: format, typecheck, unit tests with coverage thresholds, build, size budgets, e2e in Chromium, Firefox and WebKit.
- README is the package guide and the site's source of truth; public text in English. Any public API change updates tests, README, docs, examples and `skills/<name>/SKILL.md` together.
- Releases: Keep a Changelog entry for every user-facing change, semver, pinned CDN URLs bumped before release. Publishing is manual (`bun run release` by the maintainer); CI never publishes; no `--provenance`.
- Public repository: no dated reports, handoff notes, transcripts or client names; private notes go in the ignored `.local/`. Site examples with state offer Reset; icons are SVG, never Unicode glyphs.
- Work skills: `npx autoskills -y -a universal`, tracked with `skills-lock.json`, minus the `bun` skill (it contradicts pnpm installs), plus `modern-web-guidance`, consulted before HTML, CSS or client-side JavaScript work.
- Always explore code through the `codebase-memory` skill and graph when `codebase-memory-mcp` is installed; read source for gaps.
- Delegation: the main session leads (plans, decides, owns quality and security) and delegates on its own judgment; the maintainer authorizes these subagents in advance, so never wait to be asked. Search and reading go to `Explore` (Haiku), planned implementation to `implementer` (Sonnet), review of every non-trivial diff to `reviewer` (Sonnet), defined in `.agents/agents/` (`.claude/agents` points there). Skip delegation only for questions and one-line edits. The lead steps in when an agent loops or is blocked, and verifies every agent report before calling work done.
- Never add AI attribution to commits, tags or pull requests.

<!-- samline:family:end -->
