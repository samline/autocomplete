# Copied example loading modes audit

Reviewed on 2026-11-14 against the sibling package checkouts in `../`.

## Findings

| Project                          | Result                                                                                                                                                                                                                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| autocomplete                     | Custom PackagePreview bypassed the CDN/ESM tabs in DemoCode. Added PackageCode, explicit package sources, module scripts, stylesheet imports and declarative mount().                                                                                                                         |
| utils                            | The same custom-example generator exposed only CDN for counter, debounce, horizontal-scroll, is-visible, reveal, scroll-spy, scroll-to, string and theme. Added both modes using public exports. Preserved Theme's CDN head options and generated its ESM prepaint script with themeScript(). |
| package-landing-docs             | Fixed the shared generator and preview, documented required js/esm sources and added collection-fixture regressions for both modes and ESM-only delivery.                                                                                                                                     |
| ticker                           | Existing ExampleRecipe already provides both modes and split/complete files; used as the reference.                                                                                                                                                                                           |
| drawer, formatter, forms, notify | Their active galleries use DemoCode with both loading modes. No correction needed for this omission.                                                                                                                                                                                          |
| date                             | No website code disclosures to correct.                                                                                                                                                                                                                                                       |

This is an audit of the loading-mode omission, not a general runtime or documentation audit of the unaffected packages. Existing changes in utils, notify and local agent settings were preserved.

## Verification

- Autocomplete: package build, typecheck, 74 Vitest tests, formatting and npm pack dry-run passed. Site build verified 436 links across 11 pages; 56 site tooling tests passed.
- Autocomplete browser checks: 79 tests execute the exact rendered CDN/ESM source, both complete and split, including all advanced behaviors. Another 12 checks passed for routes, copying, nested keyboard tabs, mobile/desktop, no JavaScript, both themes and accessibility; five scenario-only checks were skipped for the custom preview site. Inspected the 320px dark-theme open-code screenshot.
- Utils: site build verified 3,166 links across 90 pages and Astro checks passed. All 112 behavior tests passed across both loading modes and file variants. Nine additional browser checks verified mode keyboard navigation and exact module copying on each package's Examples and Docs routes.
- Template: collection-fixture builds check CDN/ESM tabs and module files, plus a second build without CDN delivery. Package-specific browser execution remains the responsibility of each adaptation.

The browser runners read the generated CodeFiles output. Package examples pass through esbuild with aliases to local public build entrypoints, matching a consumer bundler; CDN requests resolve to those same local builds. No registry availability or deployment is asserted.
