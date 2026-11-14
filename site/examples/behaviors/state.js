export const setupState = (root, createAutocomplete) => {
  const output = root.querySelector('[data-state]')
  const submitted = root.querySelector('[data-submitted]')
  const events = new AbortController()
  const saved = { id: 'engineering', label: 'Engineering' }
  const controller = createAutocomplete(root.querySelector('input[type="text"]'), {
    source: [{ id: 'design', label: 'Design' }, saved, { id: 'support', label: 'Support' }],
    popover: true,
    placement: 'top',
    debounce: 0,
    getId: item => item.id,
    getLabel: item => item.label,
    hiddenInput: 'team_id',
  })
  const render = state => {
    output.textContent = `Status: ${state.status} · Open: ${state.open} · Results: ${state.suggestions.length} · Selected: ${state.selected?.label ?? 'none'}`
  }
  const unsubscribe = controller.subscribe(render)
  controller.setValue(saved)
  render(controller.getState())
  root.querySelector('[data-prefill]').addEventListener(
    'click',
    () => {
      controller.setValue(saved)
    },
    { signal: events.signal }
  )
  root
    .querySelector('[data-clear]')
    .addEventListener('click', () => controller.clear(), { signal: events.signal })
  root.querySelector('form').addEventListener(
    'submit',
    event => {
      event.preventDefault()
      const id = new FormData(event.currentTarget).get('team_id')
      submitted.textContent = id ? `Submitted team_id=${id}.` : 'Pick a team first.'
    },
    { signal: events.signal }
  )
  return () => {
    events.abort()
    unsubscribe()
    controller.destroy()
  }
}
