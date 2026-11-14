// Self-contained: the gallery derives its copyable JavaScript from this setup.
export const setupPalette = (root, createAutocomplete) => {
  const input = root.querySelector('input')
  const output = root.querySelector('[data-output]')
  const actions = [
    { id: 'new-document', label: 'New document', keywords: 'create add file', shortcut: 'N' },
    { id: 'invite', label: 'Invite a teammate', keywords: 'share people member', shortcut: 'I' },
    { id: 'theme', label: 'Switch theme', keywords: 'dark light appearance', shortcut: 'T' },
  ]
  const pages = [
    { id: 'billing', label: 'Billing', keywords: 'invoice payment plan' },
    { id: 'reports', label: 'Reports', keywords: 'analytics charts metrics' },
    { id: 'settings', label: 'Settings', keywords: 'preferences account profile' },
  ]
  const isAction = new Set(actions.map(item => item.id))
  const normalize = text => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
  // Match the label or any keyword, so “invoice” finds Billing.
  const filter = (item, query) =>
    normalize(`${item.label} ${item.keywords}`).includes(normalize(query))
  const controller = createAutocomplete(input, {
    sections: [
      { id: 'actions', label: 'Actions', source: actions, filter },
      { id: 'pages', label: 'Go to', source: pages, filter },
    ],
    getId: item => item.id,
    getLabel: item => item.label,
    recent: { label: 'Recent', max: 3 },
    renderOption: (element, item, { highlight, query }) => {
      // The label already holds <mark> parts; explain keyword-only matches.
      if (query && !highlight.some(part => part.match)) {
        const hint = document.createElement('small')
        hint.textContent = `Matches “${query}” in ${item.keywords}`
        element.append(hint)
      }
      if (item.shortcut) {
        // Prepended so the floated hint sits on the label's line.
        const key = document.createElement('kbd')
        key.textContent = item.shortcut
        key.setAttribute('aria-hidden', 'true')
        element.prepend(key)
      }
    },
    renderFooter: element => {
      element.textContent = '↑ ↓ to move · Enter to run · Esc to close'
    },
  })
  // The select event reports the section, including recent picks.
  const off = controller.on('select', ({ suggestion, section }) => {
    const verb = isAction.has(suggestion.id) ? 'Ran' : 'Opened'
    output.textContent = `${verb} “${suggestion.label}” from ${section}.`
    controller.clear()
  })
  return () => {
    off()
    controller.destroy()
  }
}
