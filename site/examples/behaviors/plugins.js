export const setupPlugins = (root, createAutocomplete) => {
  const input = root.querySelector('input')
  const note = root.querySelector('[data-note]')
  const requests = root.querySelector('[data-requests]')
  const events = new AbortController()
  let calls = 0
  // A reusable plugin: subscriptions belong to setup and are released on destroy.
  const telemetry = output => ({
    name: 'search-telemetry',
    setup: controller => {
      const off = controller.on('load', ({ query, cached, suggestions }) => {
        output.textContent = `“${query}”: ${suggestions.length} results · ${cached ? 'cache hit' : 'source called'}`
      })
      return { destroy: off }
    },
  })
  const controller = createAutocomplete(input, {
    source: async query => {
      calls += 1
      requests.textContent = `Source calls: ${calls}`
      return ['Design', 'Engineering', 'Marketing'].filter(label =>
        label.toLowerCase().includes(query.toLowerCase())
      )
    },
    popover: true,
    placement: 'top',
    debounce: 0,
    cache: { max: 10, ttl: 60000 },
    plugins: [telemetry(note)],
  })
  root.querySelector('[data-repeat]').addEventListener(
    'click',
    () => {
      void controller.search(input.value || 'en')
    },
    { signal: events.signal }
  )
  root.querySelector('[data-clear-cache]').addEventListener(
    'click',
    () => {
      controller.clearCache()
      note.textContent = 'Cache cleared. Repeat the search to call the source again.'
    },
    { signal: events.signal }
  )
  return () => {
    events.abort()
    controller.destroy()
  }
}
