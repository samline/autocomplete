export const setupHooks = (root, createAutocomplete) => {
  const note = root.querySelector('[data-note]')
  const controller = createAutocomplete(root.querySelector('input'), {
    source: [
      { id: 'design', label: 'Design', enabled: true },
      { id: 'design', label: 'Design', enabled: true },
      { id: 'engineering', label: 'Engineering', enabled: true },
      { id: 'enterprise', label: 'Enterprise (unavailable)', enabled: false },
    ],
    minLength: 1,
    debounce: 0,
    getId: item => item.id,
    getLabel: item => item.label,
    beforeSearch: query => {
      const clean = query.trim().replace(/^#/, '')
      note.textContent = clean ? `Searching for “${clean}”.` : 'Type a team after #.'
      return clean || false
    },
    transformSuggestions: items =>
      [...new Map(items.map(item => [item.id, item])).values()].sort((a, b) =>
        a.label.localeCompare(b.label)
      ),
    beforeSelect: item => {
      if (!item.enabled) {
        note.textContent = 'Enterprise is unavailable. Choose another team.'
        return false
      }
    },
    renderOption: (element, item) => {
      if (!item.enabled) element.setAttribute('aria-disabled', 'true')
    },
    onSelect: item => {
      note.textContent = `Selected ${item.label}.`
    },
  })
  return () => controller.destroy()
}
