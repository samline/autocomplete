import { expect, test } from '@playwright/test'

for (const route of ['examples/', 'docs/guides/examples/']) {
  test(`${route}: loading tabs, nested keyboard navigation and exact copies`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto(route)
    const preview = page.locator('[data-package-example="site/basic"]')
    await preview.locator('summary').click()
    const modes = preview.locator('[data-package-code]')
    const cdn = modes.getByRole('tab', { name: 'HTML / CDN', exact: true })
    const esm = modes.getByRole('tab', { name: 'Package / ESM', exact: true })
    await expect(cdn).toHaveAttribute('aria-selected', 'true')
    await cdn.focus()
    await page.keyboard.press('ArrowRight')
    await expect(esm).toBeFocused()
    await expect(esm).toHaveAttribute('aria-selected', 'true')
    const panel = modes.locator('[data-panel="esm"]')
    await panel.getByRole('tab', { name: 'JavaScript', exact: true }).click()
    const javascript = panel.locator('[data-panel="javascript"]')
    const code = await javascript.locator('code').textContent()
    expect(code).toContain('@samline/autocomplete/browser')
    expect(code).not.toContain('window.Autocomplete')
    await javascript.getByRole('button', { name: /copy/i }).click()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(code)
    await expect(esm).toHaveAttribute('aria-selected', 'true')
  })
}

for (const width of [320, 1440]) {
  test(`open code fits both themes at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('examples/')
    const preview = page.locator('[data-package-example="site/basic"]')
    await preview.locator('summary').click()
    for (const theme of ['light', 'dark']) {
      await page.evaluate(theme => {
        document.documentElement.dataset.theme = theme
      }, theme)
      for (const mode of ['HTML / CDN', 'Package / ESM']) {
        await preview.getByRole('tab', { name: mode, exact: true }).click()
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
        ).toBe(true)
      }
      await preview.screenshot({ path: testInfo.outputPath(`code-${width}-${theme}.png`) })
    }
  })
}

test('loading and file labels stay readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto(test.info().project.use.baseURL + 'examples/')
  const preview = page.locator('[data-package-example="site/basic"]')
  await preview.locator('summary').click()
  await expect(preview.locator('[data-panel="cdn"] > .fallback-label')).toHaveText('HTML / CDN')
  await expect(preview.locator('[data-panel="esm"] > .fallback-label')).toHaveText('Package / ESM')
  await expect(preview.locator('[data-panel="esm"] [data-panel="javascript"] code')).toBeVisible()
  await context.close()
})
