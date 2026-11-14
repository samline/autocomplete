import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page, type Locator } from '@playwright/test'
import { openCopiedFiles } from './copied-files'

const local = (path: string) => fileURLToPath(new URL(`../${path}`, import.meta.url))

test.beforeEach(async ({ page }) => {
  await page.route('https://cdn.jsdelivr.net/npm/@samline/autocomplete@*/dist/**', async route => {
    const file = new URL(route.request().url()).pathname.replace(/^.*\/dist\//, 'dist/')
    await route.fulfill({ path: local(file), headers: { 'Access-Control-Allow-Origin': '*' } })
  })
})

const choose = async (root: Locator, query: string) => {
  const input = root.locator('input[type="text"]')
  await input.fill(query)
  await expect(root.locator('[data-autocomplete-option]')).toHaveCount(1)
  await input.press('ArrowDown')
  await input.press('Enter')
}

for (const mode of [
  'cdn-complete',
  'cdn-split',
  'esm-complete',
  'esm-split',
  'gallery',
  'docs',
] as const) {
  test.describe(mode, () => {
    const open = async (page: Page, id: string) => {
      if (mode.startsWith('cdn-') || mode.startsWith('esm-')) {
        await openCopiedFiles(
          page,
          id,
          mode.startsWith('esm') ? 'esm' : 'cdn',
          mode.endsWith('split') ? 'split' : 'complete'
        )
      } else {
        await page.goto(mode === 'gallery' ? 'examples/' : 'docs/guides/examples/')
      }
      const root = page.locator(`[data-example="${id}"]`)
      await expect(root).toBeVisible()
      if (mode === 'gallery' || mode === 'docs')
        await expect(root.locator('..')).toHaveAttribute('data-mounted', 'true')
      return root
    }

    for (const id of ['pills-external', 'pills-inline']) {
      test(`${id}: adds, excludes duplicates, removes, submits and resets`, async ({ page }) => {
        const root = await open(page, id)
        await choose(root, 'des')
        await expect(root.locator('input[type="text"]')).toHaveValue('')
        await expect(root.locator('[data-pills] li')).toHaveCount(1)
        await expect(root.locator('[data-values] input')).toHaveValue('design')
        await root.locator('input[type="text"]').fill('des')
        await expect(root.locator('[data-autocomplete-status]')).toHaveText(
          'No more matching teams.'
        )
        await choose(root, 'eng')
        await root.getByRole('button', { name: 'Submit teams' }).click()
        await expect(root.locator('[data-submitted]')).toHaveText(
          'Submitted teams: design, engineering.'
        )
        await root.getByRole('button', { name: 'Remove Design', exact: true }).click()
        await expect(root.locator('input[type="text"]')).toBeFocused()
        await expect(root.locator('[data-values] input')).toHaveValue('engineering')
        await choose(root, 'des')
        await root.getByRole('button', { name: 'Reset teams' }).click()
        await expect(root.locator('[data-pills] li')).toHaveCount(0)
        await expect(root.locator('[data-values] input')).toHaveCount(0)
        await root.getByRole('button', { name: 'Submit teams' }).click()
        await expect(root.locator('[data-submitted]')).toHaveText('Select at least one team.')
      })
    }

    test('inline pills: keyboard navigation and intentional deletion', async ({ page }) => {
      const root = await open(page, 'pills-inline')
      await choose(root, 'des')
      await choose(root, 'eng')
      const input = root.locator('input[type="text"]')
      await input.press('Backspace')
      await expect(
        root.getByRole('button', { name: 'Remove Engineering', exact: true })
      ).toBeFocused()
      await expect(root.locator('[data-pills] li')).toHaveCount(2)
      await page.keyboard.press('ArrowLeft')
      await expect(root.getByRole('button', { name: 'Remove Design', exact: true })).toBeFocused()
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('Escape')
      await expect(input).toBeFocused()
      await input.fill('x')
      await input.press('Backspace')
      await expect(input).toBeFocused()
      await input.press('Backspace')
      await page.keyboard.press('Delete')
      await expect(root.locator('[data-pills] li')).toHaveCount(1)
      await expect(input).toBeFocused()
    })

    test('hooks: cleans queries, deduplicates and blocks unavailable selections', async ({
      page,
    }) => {
      const root = await open(page, 'hooks')
      await choose(root, '#de')
      await expect(root.locator('[data-note]')).toHaveText('Selected Design.')
      const input = root.locator('input')
      await input.fill('en')
      await expect(root.locator('[data-autocomplete-option]')).toHaveCount(2)
      await input.press('End')
      await input.press('Enter')
      await expect(root.locator('[data-note]')).toHaveText(
        'Enterprise is unavailable. Choose another team.'
      )
      await expect(input).toHaveAttribute('aria-expanded', 'true')
      await input.press('Home')
      await input.press('Enter')
      await expect(root.locator('[data-note]')).toHaveText('Selected Engineering.')
    })

    test('plugins: reports cached loads and invalidation', async ({ page }) => {
      const root = await open(page, 'plugins')
      await root.locator('input').fill('en')
      await expect(root.locator('[data-note]')).toContainText('source called')
      await expect(root.locator('[data-requests]')).toHaveText('Source calls: 1')
      await root.getByRole('button', { name: 'Repeat search' }).click()
      await expect(root.locator('[data-note]')).toContainText('cache hit')
      await expect(root.locator('[data-requests]')).toHaveText('Source calls: 1')
      await root.getByRole('button', { name: 'Clear cache' }).click()
      await root.getByRole('button', { name: 'Repeat search' }).click()
      await expect(root.locator('[data-note]')).toContainText('source called')
      await expect(root.locator('[data-requests]')).toHaveText('Source calls: 2')
    })

    test('state: prefills, invalidates edited ids and restores an assignment', async ({ page }) => {
      const root = await open(page, 'state')
      await expect(root.locator('input[type="text"]')).toHaveValue('Engineering')
      await expect(root.locator('[data-state]')).toContainText('Selected: Engineering')
      await root.getByRole('button', { name: 'Save assignment' }).click()
      await expect(root.locator('[data-submitted]')).toHaveText('Submitted team_id=engineering.')
      await root.locator('input[type="text"]').fill('des')
      await expect(root.locator('input[type="hidden"]')).toHaveValue('')
      await expect(root.locator('[data-state]')).toContainText('Selected: none')
      await root.getByRole('button', { name: 'Restore saved team' }).click()
      await expect(root.locator('input[type="hidden"]')).toHaveValue('engineering')
      await root.getByRole('button', { name: 'Clear team' }).click()
      await expect(root.locator('input[type="text"]')).toHaveValue('')
      await expect(root.locator('[data-state]')).toContainText('Selected: none')
    })

    test('rendering: loading, results, empty, error and recovery', async ({ page }) => {
      const root = await open(page, 'rendering')
      const input = root.locator('input[type="text"]')
      await input.fill('en')
      await expect(root.locator('[data-autocomplete-status]')).toHaveText(
        'Checking the team directory…'
      )
      await expect(root.locator('[data-autocomplete-option]')).toHaveText(['Engineering'])
      await expect(root.locator('[data-autocomplete-header]')).toHaveText(
        'Team directory · 1 matches'
      )
      await expect(root.locator('[data-autocomplete-footer]')).toContainText('Enter to choose')
      await input.fill('zzz')
      await expect(root.locator('[data-autocomplete-status]')).toContainText('No teams match')
      await root.getByRole('checkbox').check()
      await input.fill('de')
      await expect(root.locator('[data-autocomplete-status]')).toContainText(
        'Directory unavailable'
      )
      await root.getByRole('checkbox').uncheck()
      await input.fill('en')
      await expect(root.locator('[data-autocomplete-option]')).toHaveText(['Engineering'])
    })

    test('headless: filters a custom directory with native button navigation', async ({ page }) => {
      const root = await open(page, 'headless')
      await expect(root.locator('[data-results] button')).toHaveCount(3)
      await root.locator('input').fill('en')
      await expect(root.locator('[data-results] button')).toHaveCount(1)
      await root.locator('input').press('Tab')
      await page.keyboard.press('Enter')
      await expect(root.locator('[data-note]')).toHaveText('Opened Engineering.')
      await root.locator('input').fill('zzz')
      await expect(root.locator('[data-results] button')).toHaveCount(0)
      await expect(root.locator('[data-note]')).toContainText('0 teams available')
    })
  })
}

test('advanced previews release controllers and remount after removal', async ({ page }) => {
  await page.goto('examples/')
  const preview = page.locator('[data-advanced-preview="pills-inline"]')
  await expect(preview).toHaveAttribute('data-mounted', 'true')
  await choose(preview, 'des')
  await preview.evaluate(element => {
    const clone = element.cloneNode(true) as HTMLElement
    clone.removeAttribute('data-mounted')
    clone
      .querySelectorAll('[data-autocomplete-popup], [data-autocomplete-live]')
      .forEach(node => node.remove())
    element.replaceWith(clone)
  })
  await expect(preview).toHaveAttribute('data-mounted', 'true')
  await expect(preview.locator('[data-autocomplete-popup]')).toHaveCount(1)
  await choose(preview, 'eng')
  await expect(preview.locator('[data-values] input')).toHaveValue('engineering')
})

for (const width of [390, 1280]) {
  test(`pills layout and accessibility at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('examples/')
    for (const id of ['pills-external', 'pills-inline']) {
      const root = page.locator(`[data-example="${id}"]`)
      await choose(root, 'des')
      await choose(root, 'eng')
      await choose(root, 'mar')
      await expect(root.locator('[data-pills] li')).toHaveCount(3)
      const fits = await root.evaluate(element => element.scrollWidth <= element.clientWidth + 1)
      expect(fits).toBe(true)
      await root.screenshot({ path: testInfo.outputPath(`${id}-${width}.png`) })
    }
    await page.addScriptTag({ path: local('node_modules/axe-core/axe.min.js') })
    const violations = await page.evaluate(async () => {
      const axe = (window as any).axe
      const result = await axe.run({ include: ['[data-advanced-preview]'] })
      return result.violations.map((item: any) => ({
        id: item.id,
        nodes: item.nodes.map((node: any) => node.target),
      }))
    })
    expect(violations).toEqual([])
  })
}
