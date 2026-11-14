import type { AutocompleteOptions, AutocompletePlacement } from '../core/types'

const readNumber = (value: string | undefined): number | undefined => {
  if (value === undefined || value.trim() === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

// Present and not "false": `data-autocomplete-popover` and `="true"` both enable.
const readFlag = (value: string | undefined): boolean | undefined =>
  value === undefined ? undefined : value !== 'false'

const readField =
  (key: string) =>
  (suggestion: unknown): unknown =>
    suggestion && typeof suggestion === 'object'
      ? (suggestion as Record<string, unknown>)[key]
      : suggestion

const readJsonSource = (value: string): unknown[] => {
  const json = value.trim().startsWith('[')
    ? value
    : (document.querySelector(value)?.textContent ?? '')
  const parsed: unknown = JSON.parse(json)
  if (!Array.isArray(parsed)) {
    throw new TypeError('Autocomplete data-autocomplete-source must be a JSON array.')
  }
  return parsed
}

/**
 * Reads options from `data-autocomplete*` attributes on an input:
 * `data-autocomplete="/api/cities"` (endpoint) or `data-autocomplete-source`
 * (a JSON array, or a selector of a `<script type="application/json">`),
 * plus `-min-length`, `-debounce`, `-max-results`, `-query-param`, `-placement`,
 * `-popover`, `-highlight`, `-cache`, `-search-on-focus`, `-hidden-input`,
 * `-recent`, `-recent-label`, `-label-key`, `-value-key`, `-id-key` and the
 * `-loading`, `-empty`, `-error` messages.
 */
export const optionsFromDataset = <T = unknown>(
  input: HTMLInputElement
): AutocompleteOptions<T> => {
  const data = input.dataset
  const options: Record<string, unknown> = {}
  const set = (key: string, value: unknown): void => {
    if (value !== undefined) options[key] = value
  }

  if (data.autocompleteSource !== undefined)
    options.source = readJsonSource(data.autocompleteSource)
  else if (data.autocomplete) options.endpoint = data.autocomplete

  set('minLength', readNumber(data.autocompleteMinLength))
  set('debounce', readNumber(data.autocompleteDebounce))
  set('maxResults', readNumber(data.autocompleteMaxResults))
  set('offset', readNumber(data.autocompleteOffset))
  if (data.autocompleteQueryParam !== undefined) {
    options.queryParam = data.autocompleteQueryParam === '' ? null : data.autocompleteQueryParam
  }
  set('placement', data.autocompletePlacement as AutocompletePlacement | undefined)
  set('popover', readFlag(data.autocompletePopover))
  set('highlight', readFlag(data.autocompleteHighlight))
  set('cache', readFlag(data.autocompleteCache))
  set('searchOnFocus', readFlag(data.autocompleteSearchOnFocus))
  set('hiddenInput', data.autocompleteHiddenInput || undefined)

  if (readFlag(data.autocompleteRecent)) {
    options.recent = data.autocompleteRecentLabel ? { label: data.autocompleteRecentLabel } : true
  }

  const labelKey = data.autocompleteLabelKey
  const valueKey = data.autocompleteValueKey ?? labelKey
  const idKey = data.autocompleteIdKey
  if (labelKey) options.getLabel = (item: unknown) => String(readField(labelKey)(item) ?? '')
  if (valueKey) options.getValue = (item: unknown) => String(readField(valueKey)(item) ?? '')
  if (idKey) {
    options.getId = (item: unknown, index: number) => String(readField(idKey)(item) ?? index)
  }

  const messages: Record<string, string> = {}
  for (const key of ['loading', 'empty', 'error'] as const) {
    const value = data[`autocomplete${key[0]!.toUpperCase()}${key.slice(1)}`]
    if (value) messages[key] = value
  }
  if (Object.keys(messages).length > 0) options.messages = messages

  return options as AutocompleteOptions<T>
}
