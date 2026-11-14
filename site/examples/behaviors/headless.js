export const setupHeadless = (root, createSearch) => {
  const input = root.querySelector('input')
  const results = root.querySelector('[data-results]')
  const note = root.querySelector('[data-note]')
  const events = new AbortController()
  // This is a filterable directory of buttons, not a combobox. The application
  // owns its markup and keyboard behavior; createSearch only supplies results.
  const engine = createSearch({
    source: [
      { id: 'design', label: 'Design', description: 'Visual systems and product experiences' },
      { id: 'engineering', label: 'Engineering', description: 'Software and infrastructure' },
      { id: 'support', label: 'Support', description: 'Help for our customers' },
    ],
    getLabel: item => item.label,
  })
  let pending
  const search = async () => {
    pending?.abort()
    const request = new AbortController()
    pending = request
    const result = await engine.run(input.value, { signal: request.signal, input })
    if (request.signal.aborted || result.aborted) return
    results.replaceChildren()
    for (const { suggestions } of result.sections) {
      for (const item of suggestions) {
        const li = document.createElement('li')
        const button = document.createElement('button')
        button.type = 'button'
        button.textContent = `${item.label} — ${item.description}`
        button.addEventListener('click', () => {
          note.textContent = `Opened ${item.label}.`
        })
        li.append(button)
        results.append(li)
      }
    }
    note.textContent = `${result.count} teams available. Tab to a result and press Enter.`
  }
  input.addEventListener('input', search, { signal: events.signal })
  void search()
  return () => {
    events.abort()
    pending?.abort()
    engine.clearCache()
    results.replaceChildren()
  }
}
