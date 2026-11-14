export const DEFAULT_QUERY_PARAM = 'q'
export const DEFAULT_MIN_LENGTH = 2
export const DEFAULT_DEBOUNCE = 250
export const DEFAULT_MAX_RESULTS = 8

/** Cached queries kept per instance when `cache` is enabled. */
export const DEFAULT_CACHE_SIZE = 50
/** Milliseconds a cached query stays fresh; five minutes. */
export const DEFAULT_CACHE_TTL = 300_000

export const POPUP_ATTRIBUTE = 'data-autocomplete-popup'
export const LIST_ATTRIBUTE = 'data-autocomplete-list'
export const OPTION_ATTRIBUTE = 'data-autocomplete-option'
export const STATUS_ATTRIBUTE = 'data-autocomplete-status'
export const LIVE_ATTRIBUTE = 'data-autocomplete-live'
export const HIGHLIGHT_ATTRIBUTE = 'data-autocomplete-highlight'

/** Recent selections kept by the default store. */
export const DEFAULT_RECENT_MAX = 5
export const DEFAULT_RECENT_LABEL = 'Recent searches'
/** Gap in CSS pixels between the input and a popover popup. */
export const DEFAULT_POPOVER_OFFSET = 4

export const GROUP_ATTRIBUTE = 'data-autocomplete-group'
export const GROUP_LABEL_ATTRIBUTE = 'data-autocomplete-group-label'
export const HEADER_ATTRIBUTE = 'data-autocomplete-header'
export const FOOTER_ATTRIBUTE = 'data-autocomplete-footer'
export const HIDDEN_INPUT_ATTRIBUTE = 'data-autocomplete-hidden'
