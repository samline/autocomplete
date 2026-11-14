// Checks what npm actually publishes: ESM, CommonJS, the browser global as a
// classic script, the stylesheet, and that no website or dev file leaks in.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import vm from 'node:vm'

const expected = [
  'autocomplete',
  'createAutocomplete',
  'createCache',
  'createRecentStore',
  'createSearch',
  'filterSuggestions',
  'fromEndpoint',
  'getMounted',
  'highlight',
  'mapCommonResponse',
  'mount',
  'normalizeText',
  'optionsFromDataset',
  'parseJsonResponse',
  'refresh',
  'renderHighlight',
  'unmount',
]
const registry = [
  'autocomplete',
  'available',
  'destroyAutocomplete',
  'destroyAutocompletes',
  'getAutocomplete',
  'getAutocompletes',
  'getMounted',
  'mount',
  'newAutocomplete',
  'refresh',
  'unmount',
]
const functionsOf = api =>
  Object.keys(api)
    .filter(key => typeof api[key] === 'function')
    .sort()

const require = createRequire(import.meta.url)
const esm = await import('../dist/index.js')
const cjs = require('../dist/index.cjs')
for (const api of [esm, cjs]) {
  assert.deepEqual(functionsOf(api), expected)
  assert.deepEqual(Object.keys(api.Autocomplete).sort(), registry)
  assert.equal(api.browser, api.Autocomplete)
  assert.deepEqual(api.mapCommonResponse({ items: [1, 2] }), [1, 2])
  assert.equal(api.normalizeText('Cañón'), 'canon')
}
assert.equal(globalThis.Autocomplete, undefined, 'The root import must not install a global')

const source = await readFile(new URL('../dist/browser/global.global.js', import.meta.url), 'utf8')
const context = {}
vm.runInNewContext(source, context)
assert.deepEqual(Object.keys(context.Autocomplete).sort(), registry)

for (const subpath of ['core', 'vanilla', 'browser']) {
  const esmSubpath = await import(`../dist/${subpath}/index.js`)
  const cjsSubpath = require(`../dist/${subpath}/index.cjs`)
  assert.deepEqual(Object.keys(esmSubpath).sort(), Object.keys(cjsSubpath).sort())
}

const [packed] = JSON.parse(
  execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { encoding: 'utf8' })
)
const paths = new Set(packed.files.map(file => file.path))
const allowed = ['package.json', 'README.md', 'LICENSE.md', 'CHANGELOG.md']
for (const file of [...allowed, 'dist/browser/global.global.js', 'dist/styles.css'])
  assert.ok(paths.has(file), `Missing published file: ${file}`)
const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const checkExport = entry => {
  if (typeof entry === 'string')
    assert.ok(paths.has(entry.replace(/^\.\//, '')), `Missing export: ${entry}`)
  else Object.values(entry).forEach(checkExport)
}
checkExport(manifest.exports)
for (const file of paths)
  assert.ok(
    file.startsWith('dist/') || allowed.includes(file),
    `Development or website file leaked into npm: ${file}`
  )
console.log(`Package smoke test passed: ESM, CommonJS, IIFE, styles and ${paths.size} npm files.`)
