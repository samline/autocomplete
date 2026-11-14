export const setupRendering = (root, createAutocomplete) => {
  const failure = root.querySelector('input[type="checkbox"]')
  const controller = createAutocomplete(root.querySelector('input[type="text"]'), {
    source: async (query, { signal }) => {
      // A deterministic demo service. Aborting also releases its pending timer.
      await new Promise((resolve, reject) => {
        const abort = () => {
          clearTimeout(timer)
          reject(new DOMException('Aborted', 'AbortError'))
        }
        const timer = setTimeout(() => {
          signal.removeEventListener('abort', abort)
          resolve()
        }, 350)
        if (signal.aborted) abort()
        else signal.addEventListener('abort', abort, { once: true })
      })
      if (failure.checked) throw new Error('Demo service unavailable')
      return ['Design', 'Engineering', 'Marketing'].filter(label =>
        label.toLowerCase().includes(query.toLowerCase())
      )
    },
    popover: true,
    placement: 'top',
    debounce: 0,
    cache: false,
    renderStatus: (element, { state, query }) => {
      element.textContent =
        state === 'loading'
          ? 'Checking the team directory…'
          : state === 'error'
            ? 'Directory unavailable. Turn off “Simulate failure” and search again.'
            : `No teams match “${query}”. Try “en”.`
    },
    renderHeader: (element, { count }) => {
      element.textContent = `Team directory · ${count} matches`
    },
    renderFooter: element => {
      element.textContent = 'Use ↑ ↓ to navigate and Enter to choose.'
    },
  })
  return () => controller.destroy()
}
