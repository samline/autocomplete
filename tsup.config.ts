import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { defineConfig } from 'tsup'

const copyStyles = async (): Promise<void> => {
  copyFileSync(resolve('src/styles.css'), resolve('dist/styles.css'))
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
    entry: { 'browser/global': 'src/browser/global.ts' },
    format: ['iife'],
    dts: true,
    sourcemap: true,
    clean: false,
    target: 'es2020',
    outDir: 'dist',
    globalName: 'AutocompleteBundle',
  },
])
