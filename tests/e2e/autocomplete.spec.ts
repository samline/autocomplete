import { expect, test } from './fixtures'

const markup = `
  <label for="city">City</label>
  <input id="city" data-autocomplete data-autocomplete-source='["Lima","London","Los Angeles","Madrid"]'>
  <p id="picked"></p>
`

test('the CDN bundle exposes window.Autocomplete without a default export', async ({ load }) => {
  const page = await load(markup, 'autocomplete')
  const keys = await page.evaluate(() => Object.keys((window as any).Autocomplete))
  expect(keys).toContain('autocomplete')
  expect(keys).toContain('mount')
  expect(keys).not.toContain('default')
  expect(await page.evaluate(() => typeof (window as any).AutocompleteBundle)).toBe('undefined')
})

test('the classic script enhances declarative inputs and filters as you type', async ({ load }) => {
  const page = await load(markup, 'autocomplete')
  const input = page.getByRole('combobox', { name: 'City' })
  await input.fill('lo')
  await expect(input).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('option')).toHaveText(['London', 'Los Angeles'])
})

test('the keyboard selects an option and Escape closes the list', async ({ load }) => {
  const page = await load(markup, 'autocomplete')
  const input = page.getByRole('combobox', { name: 'City' })
  await input.fill('l')
  await input.press('ArrowDown')
  await input.press('Enter')
  await expect(input).toHaveValue('Lima')
  await expect(input).toHaveAttribute('aria-expanded', 'false')
  await input.fill('mad')
  await expect(page.getByRole('option')).toHaveText(['Madrid'])
  await input.press('Escape')
  await expect(input).toHaveAttribute('aria-expanded', 'false')
})
