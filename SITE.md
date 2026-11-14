# Autocomplete website

Landing, Examples and Docs for `@samline/autocomplete` 1.0.0, built with [package-landing-docs](https://github.com/samline/package-landing-docs) embedded in this package. The package's runtime, exports, Node 20+ requirement, README, license and release history remain the package contract. Website tooling requires Node **22.12+**.

## Run locally

```sh
bun install --frozen-lockfile
bun run build
bun run site:dev
```

Open <http://127.0.0.1:4370/autocomplete/>. Docs runs on 4371. Ports come from `project.config.json` `dev`. For the complete production artifact:

```sh
bun run build
bun run site:build
bun run site:preview
```

The combined Pages artifact is `landing/dist/`. No backend is required: the previews search `landing/public/cities.json`.

## Maintain

- `project.config.json` owns site identity, URL, namespace, accent pair, CDN script and stylesheet, and package version. Keep the CDN pins aligned with `package.json`.
- Home copy lives in `landing/src/i18n/translations/en/sections.ts`; articles in `docs/src/content/docs/`.
- Previews: `site/Demo.astro` (Home) and `site/examples.ts` with `site/examples/*.astro` (Examples and the docs examples guide) import the package itself through a Vite alias, so build the package first. Every code disclosure offers HTML / CDN and Package / ESM, with split files and a complete document. `files.js` uses the published browser bundle; `files.esm` uses public package imports and explicitly mounts declarative inputs. `shared/components/PackageCode.astro` shares the mode tabs across Examples and Docs. `site-e2e/copied-examples.spec.ts` and `advanced-examples.spec.ts` execute the exact rendered sources in all four combinations against the local build.
- `content-audit.json` maps the reviewed sources and public exports to their destinations.
- `CHANGELOG.md` is the single release history, loaded into the docs.
- `skills/autocomplete/SKILL.md` is the package integration skill, served at `/skills/autocomplete/SKILL.md`.
- Website commands use the `site:` prefix. The npm `files` allowlist (`dist`, `CHANGELOG.md`, `LICENSE.md`) excludes the website; `test:package` asserts the real `npm pack` manifest.

## Retired documentation

The Markdown `docs/` folder and the `example/` page of 0.1.0 were migrated into this website and removed. The EasyTrip migration inventory is private and lives only in the git-ignored `.local/` folder.
