// Runs every copyable example file against the built browser bundle. CDN and
// cities.json requests are served from this repository, so the copied code is
// tested exactly as published.
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

import examples from '../site/examples'

const local = (path: string) => fileURLToPath(new URL(`../${path}`, import.meta.url))

test.beforeEach(async ({ page }) => {
  await page.route('https://cdn.jsdelivr.net/npm/@samline/autocomplete@*/dist/**', async route => {
    const file = new URL(route.request().url()).pathname.replace(/^.*\/dist\//, 'dist/')
    await route.fulfill({ path: local(file) })
  })
  await page.route('https://samline.github.io/autocomplete/cities.json*', async route =>
    route.fulfill({
      body: await readFile(local('landing/public/cities.json'), 'utf8'),
      contentType: 'application/json',
    })
  )
})

const open = async (page: import('@playwright/test').Page, id: string) => {
  const example = examples.find(item => item.id === id)!
  await page.setContent(
    `<!doctype html><html><head><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@samline/autocomplete@2.1.0/dist/styles.css"><style>${example.files.css}</style></head><body><main>${example.files.html}</main><script src="https://cdn.jsdelivr.net/npm/@samline/autocomplete@2.1.0/dist/browser/global.global.js"></script><script>${example.files.js}</script></body></html>`
  )
}

test('basic: searches, navigates with the keyboard and selects', async ({ page }) => {
  await open(page, 'basic')
  const input = page.locator('#city')
  await input.pressSequentially('san', { delay: 20 })
  await expect(page.locator('[data-autocomplete-option]')).toHaveCount(2)
  await expect(input).toHaveAttribute('aria-expanded', 'true')
  await input.press('End')
  await input.press('Enter')
  await expect(input).toHaveValue('Santiago')
  await expect(page.locator('#selected')).toHaveText('Selected Santiago.')
})

test('render: adds the country to each option', async ({ page }) => {
  await open(page, 'render')
  await page.locator('#destination').pressSequentially('m', { delay: 20 })
  await expect(page.locator('[data-autocomplete-option]')).toHaveCount(5)
  await expect(page.locator('[data-autocomplete-option] small').first()).toHaveText('Mexico')
})

test('events: keeps the hidden key in sync and clears it', async ({ page }) => {
  await open(page, 'events')
  await page.locator('#origin').pressSequentially('lis', { delay: 20 })
  await page.locator('[data-autocomplete-option]').first().dispatchEvent('pointerdown')
  await expect(page.locator('#origin-key')).toHaveValue('pt-lis')
  await expect(page.locator('#log')).toHaveText('select: Lisbon (key pt-lis)')
  await page.locator('#reset').click()
  await expect(page.locator('#origin-key')).toHaveValue('')
  await expect(page.locator('#log')).toHaveText('clear: selection removed')
})

test('local: filters an array ignoring accents and highlights the match', async ({ page }) => {
  await open(page, 'local')
  await page.locator('#state').pressSequentially('queretaro', { delay: 20 })
  await expect(page.locator('[data-autocomplete-option]')).toHaveText(['Querétaro'])
  await expect(page.locator('[data-autocomplete-highlight]')).toHaveText('Querétaro')
  await expect(page.locator('[data-autocomplete-live]')).toHaveText('1 result available')
  await page.locator('#state').fill('zzz')
  await page.locator('#state').dispatchEvent('input')
  await expect(page.locator('[data-autocomplete-status]')).toHaveText('No state matches “zzz”')
})

test('sections: groups sources and shows recent picks on focus', async ({ page }) => {
  await open(page, 'sections')
  const input = page.locator('#place')
  await input.pressSequentially('sp', { delay: 20 })
  await expect(page.locator('[data-autocomplete-group="countries"] [role="option"]')).toHaveText([
    'Spain',
  ])
  await expect(page.locator('[data-autocomplete-group-label]').first()).toHaveText('Countries')
  await input.press('ArrowDown')
  await input.press('Enter')
  await expect(input).toHaveValue('Spain')
  await input.fill('')
  await expect(page.locator('[data-autocomplete-group="recent"] [role="option"]')).toHaveText([
    'Spain',
  ])
})

test('form: submits the hidden id from a popover list', async ({ page }) => {
  await open(page, 'form')
  const input = page.locator('#destination-city')
  await input.pressSequentially('lis', { delay: 20 })
  const popup = page.locator('[data-autocomplete-popup]')
  await expect(popup).toHaveAttribute('popover', 'manual')
  await expect(popup).toBeVisible()
  await input.press('ArrowDown')
  await input.press('Enter')
  await page.locator('#trip button').click()
  await expect(page.locator('#submitted')).toHaveText('Submitted city_id=pt-lis.')
})
