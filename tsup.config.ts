import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { defineConfig } from 'tsup'

const copyStyles = async (): Promise<void> => {
  copyFileSync(resolve('src/style.css'), resolve('dist/style.css'))
  // styles.css is the pre-3.0.0 name, kept as an identical alias.
  copyFileSync(resolve('src/style.css'), resolve('dist/styles.css'))
}

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      'core/index': 'src/core/index.ts',
      'vanilla/index': 'src/vanilla/index.ts',
      'browser/index': 'src/browser/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'es2020',
    outDir: 'dist',
    onSuccess: copyStyles,
  },
  {
    // autocomplete.global.js is the family name; global.global.js stays as an
    // identical alias for CDN URLs written before 3.0.0.
    entry: {
      'browser/autocomplete': 'src/browser/global.ts',
      'browser/global': 'src/browser/global.ts',
    },
    format: ['iife'],
    dts: true,
    sourcemap: true,
    clean: false,
    target: 'es2020',
    outDir: 'dist',
    minify: true,
  },
])
