import type { AutocompletePlacement } from '../core/types'

export interface PositionerOptions {
  input: HTMLInputElement
  popup: HTMLElement
  placement: AutocompletePlacement
  popover: boolean
  offset: number
}

export interface Positioner {
  /** Call after the popup becomes visible or its content changes. */
  update: () => void
  open: () => void
  close: () => void
  destroy: () => void
}

type PopoverElement = HTMLElement & {
  showPopover?: () => void
  hidePopover?: () => void
}

const supportsPopover = (element: PopoverElement): boolean =>
  typeof element.showPopover === 'function' && typeof element.hidePopover === 'function'

/**
 * Chooses the side of the input the popup opens on and, in popover mode,
 * pins the top-layer popup to the input while the page scrolls or resizes.
 */
export const createPositioner = ({
  input,
  popup,
  placement,
  popover,
  offset,
}: PositionerOptions): Positioner => {
  const element = popup as PopoverElement
  const usePopover = popover && supportsPopover(element)
  let frame = 0
  let opened = false

  if (usePopover) element.setAttribute('popover', 'manual')

  const chooseSide = (rect: DOMRect): 'top' | 'bottom' => {
    if (placement !== 'auto') return placement
    const height = popup.offsetHeight
    const below = window.innerHeight - rect.bottom
    return below < height + offset && rect.top > below ? 'top' : 'bottom'
  }

  const update = (): void => {
    if (popup.hidden) return
    const rect = input.getBoundingClientRect()
    const side = chooseSide(rect)
    popup.dataset.placement = side

    if (usePopover) {
      Object.assign(popup.style, {
        position: 'fixed',
        inset: 'auto',
        margin: '0',
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        top: side === 'bottom' ? `${rect.bottom + offset}px` : 'auto',
        bottom: side === 'top' ? `${window.innerHeight - rect.top + offset}px` : 'auto',
      })
      return
    }

    // Absolute popups sit in the input's offset parent, which may also hold
    // the label: measure from the input instead of using `bottom: 100%`.
    const parent = popup.offsetParent as HTMLElement | null
    popup.style.bottom =
      side === 'top' && parent ? `${parent.clientHeight - input.offsetTop}px` : ''
    popup.style.top = side === 'top' ? 'auto' : ''
  }

  const schedule = (): void => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(update)
  }

  const open = (): void => {
    if (!opened) {
      opened = true
      if (usePopover) {
        if (!element.matches(':popover-open')) element.showPopover!()
        window.addEventListener('scroll', schedule, { capture: true, passive: true })
        window.addEventListener('resize', schedule, { passive: true })
      }
    }
    update()
  }

  const close = (): void => {
    if (!opened) return
    opened = false
    cancelAnimationFrame(frame)
    if (usePopover) {
      window.removeEventListener('scroll', schedule, { capture: true })
      window.removeEventListener('resize', schedule)
      if (element.matches(':popover-open')) element.hidePopover!()
    }
  }

  const destroy = (): void => {
    close()
    if (usePopover) element.removeAttribute('popover')
  }

  return { update, open, close, destroy }
}
