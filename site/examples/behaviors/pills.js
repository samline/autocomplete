// Self-contained: the gallery derives its copyable JavaScript from this setup.
export const setupPills = (root, createAutocomplete) => {
  const form = root.querySelector('form')
  const input = root.querySelector('input[type="text"]')
  const pills = root.querySelector('[data-pills]')
  const field = root.querySelector('.pill-field')
  const below = root.querySelector('[data-pills-below]')
  const values = root.querySelector('[data-values]')
  const announcement = root.querySelector('[data-announcement]')
  const submitted = root.querySelector('[data-submitted]')
  const selected = new Map()
  const events = new AbortController()
  const source = [
    { id: 'design', label: 'Design' },
    { id: 'engineering', label: 'Engineering' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'operations', label: 'Operations' },
    { id: 'support', label: 'Support' },
  ]
  const render = () => {
    pills.replaceChildren()
    values.replaceChildren()
    for (const item of selected.values()) {
      const pill = document.createElement('li')
      pill.className = 'pill'
      // The whole pill is the removal button, so any part of it removes it.
      const remove = document.createElement('button')
      remove.type = 'button'
      remove.setAttribute('aria-label', `Remove ${item.label}`)
      const label = document.createElement('span')
      label.textContent = item.label
      const icon = document.createElement('span')
      icon.setAttribute('aria-hidden', 'true')
      icon.textContent = '×'
      remove.append(label, icon)
      remove.addEventListener('click', () => {
        selected.delete(item.id)
        render()
        controller.clear()
        input.focus()
        announcement.textContent = `${item.label} removed. ${selected.size} selected.`
      })
      pill.append(remove)
      pills.append(pill)
      const hidden = document.createElement('input')
      hidden.type = 'hidden'
      hidden.name = 'teams[]'
      hidden.value = item.id
      values.append(hidden)
    }
  }
  const controller = createAutocomplete(input, {
    source,
    minLength: 0,
    debounce: 0,
    // Auto placement measures from the input; this popup is anchored below
    // the whole field instead, so keep it there.
    placement: 'bottom',
    getId: item => item.id,
    getLabel: item => item.label,
    transformSuggestions: items => items.filter(item => !selected.has(item.id)),
    beforeSelect: item => !selected.has(item.id),
    messages: { empty: 'No more matching teams.' },
    onSelect: item => {
      selected.set(item.id, item)
      render()
      controller.clear()
      announcement.textContent = `${item.label} added. ${selected.size} selected.`
    },
  })
  // The popup is created right after the input; move it after the whole
  // field so it opens below the pills too, at the field's full width.
  field.after(controller.popupElement)
  // The same pills list moves between the field and the area below it;
  // selections, hidden inputs and focus handling stay as they are.
  const place = layout => {
    if (layout === 'inside') field.prepend(pills)
    else below.append(pills)
  }
  root
    .querySelector('.layout')
    .addEventListener('change', event => place(event.target.value), { signal: events.signal })
  place(root.querySelector('.layout input:checked').value)
  // Clicking the field's padding or gaps types into the input.
  field.addEventListener(
    'click',
    event => {
      if (event.target === field) input.focus()
    },
    { signal: events.signal }
  )
  render()
  input.addEventListener(
    'keydown',
    event => {
      if (event.isComposing || input.value || !selected.size) return
      if (event.key === 'Backspace' || event.key === 'ArrowLeft') {
        event.preventDefault()
        controller.close()
        pills.querySelector('li:last-child button')?.focus()
      }
    },
    { signal: events.signal }
  )
  // Focus the last removal button first; a second Backspace/Delete removes it.
  pills.addEventListener(
    'keydown',
    event => {
      const buttons = [...pills.querySelectorAll('button')]
      const index = buttons.indexOf(document.activeElement)
      if (index < 0 || event.isComposing) return
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault()
        buttons[index].click()
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        const next = index + (event.key === 'ArrowLeft' ? -1 : 1)
        ;(buttons[next] ?? input).focus()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        input.focus()
      }
    },
    { signal: events.signal }
  )
  form.addEventListener(
    'submit',
    event => {
      event.preventDefault()
      const ids = new FormData(form).getAll('teams[]')
      submitted.textContent = ids.length
        ? `Submitted teams: ${ids.join(', ')}.`
        : 'Select at least one team.'
    },
    { signal: events.signal }
  )
  form.addEventListener(
    'reset',
    () => {
      selected.clear()
      render()
      controller.clear()
      announcement.textContent = 'All teams removed.'
      submitted.textContent = 'Nothing submitted yet.'
    },
    { signal: events.signal }
  )
  return () => {
    events.abort()
    controller.destroy()
    field.prepend(pills)
    pills.replaceChildren()
    values.replaceChildren()
  }
}
