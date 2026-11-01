
import { createHook, HookState } from '#the-cloud'
import { _sid } from '#the-cloud'

export interface RectReadOnly {
  readonly x:      number
  readonly y:      number
  readonly width:  number
  readonly height: number
  readonly top:    number
  readonly right:  number
  readonly bottom: number
  readonly left:   number
  [key: string]:   number
}

export type Options = {
  debounce?:   number | { scroll: number; resize: number }
  scroll?:     boolean
  offsetSize?: boolean
  polyfill?:   { new (cb: ResizeObserverCallback): ResizeObserver }
}

type Result = [(node: HTMLElement | SVGElement | null) => void, RectReadOnly, () => void]

const EMPTY_BOUNDS: RectReadOnly = { x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 }

const KEYS = ['x', 'y', 'top', 'bottom', 'left', 'right', 'width', 'height'] as const

function areBoundsEqual(a: RectReadOnly, b: RectReadOnly): boolean {
  return KEYS.every(k => a[k] === b[k])
}

function findScrollContainers(el: HTMLElement | SVGElement | null): (HTMLElement | SVGElement)[] {
  const result: (HTMLElement | SVGElement)[] = []
  if (!el || el === document.body) return result
  const { overflow, overflowX, overflowY } = window.getComputedStyle(el as Element)
  if ([overflow, overflowX, overflowY].some(p => p === 'auto' || p === 'scroll')) result.push(el)
  return [...result, ...findScrollContainers((el as HTMLElement).parentElement)]
}

interface MeasureHookState extends HookState {
  element:            HTMLElement | SVGElement | null
  scrollContainers:   (HTMLElement | SVGElement)[] | null
  resizeObserver:     ResizeObserver | null
  orientationHandler: (() => void) | null
  scrollHandler:      (() => void) | null
  resizeHandler:      (() => void) | null
  windowResizeHandler:(() => void) | null
  windowScrollHandler:(() => void) | null
  bounds:             RectReadOnly
  debounceTimer:      ReturnType<typeof setTimeout> | null
}

export function useMeasure(options: Options = {}, __sauron_id__ = _sid()): Result {
  const { debounce, scroll = false, offsetSize = false, polyfill } = options

  const scrollDebounce = debounce ? (typeof debounce === 'number' ? debounce : debounce.scroll) : 0
  const resizeDebounce = debounce ? (typeof debounce === 'number' ? debounce : debounce.resize) : 0

  return createHook<Result>(
    'useMeasure',
    __sauron_id__,
    (): MeasureHookState => ({
      value:               null as any,
      element:             null,
      scrollContainers:    null,
      resizeObserver:      null,
      orientationHandler:  null,
      scrollHandler:       null,
      resizeHandler:       null,
      windowResizeHandler: null,
      windowScrollHandler: null,
      bounds:              { ...EMPTY_BOUNDS },
      debounceTimer:       null
    }),
    (s: HookState, key, notify) => {
      const state = s as MeasureHookState

      const measure = () => {
        if (!state.element) return
        const el = state.element
        const r  = (el as Element).getBoundingClientRect() as unknown as RectReadOnly
        const next: RectReadOnly = {
          x: r.x, y: r.y,
          width:  offsetSize && el instanceof HTMLElement ? el.offsetWidth  : r.width,
          height: offsetSize && el instanceof HTMLElement ? el.offsetHeight : r.height,
          top: r.top, right: r.right, bottom: r.bottom, left: r.left
        }
        Object.freeze(next)
        if (!areBoundsEqual(state.bounds, next)) {
          state.bounds = next
          notify(key)
        }
      }

      const debounced = (ms: number, fn: () => void) => () => {
        if (!ms) { fn(); return }
        if (state.debounceTimer) clearTimeout(state.debounceTimer)
        state.debounceTimer = setTimeout(fn, ms)
      }

      const onResize = debounced(resizeDebounce, measure)
      const onScroll = debounced(scrollDebounce, measure)

      const removeListeners = () => {
        state.scrollContainers?.forEach(c => c.removeEventListener('scroll', state.scrollHandler as any, true))
        state.resizeObserver?.disconnect()
        state.resizeObserver = null

        if (state.orientationHandler) {
          if ('orientation' in screen && 'removeEventListener' in screen.orientation) {
            screen.orientation.removeEventListener('change', state.orientationHandler)
          } else {
            window.removeEventListener('orientationchange', state.orientationHandler)
          }
        }

        if (state.windowResizeHandler) window.removeEventListener('resize', state.windowResizeHandler)
        if (state.windowScrollHandler) window.removeEventListener('scroll', state.windowScrollHandler, true)

        state.scrollContainers    = null
        state.orientationHandler  = null
        state.windowResizeHandler = null
        state.windowScrollHandler = null
      }

      const addListeners = () => {
        if (!state.element) return

        const RO = polyfill ?? (typeof window !== 'undefined' ? (window as any).ResizeObserver : null)
        if (!RO) throw new Error('ResizeObserver not supported')

        state.scrollHandler = onScroll
        state.resizeHandler = onResize

        state.resizeObserver = new RO(onResize)
        state.resizeObserver!.observe(state.element as Element)

        if (scroll && state.scrollContainers) {
          state.scrollContainers.forEach(c =>
            c.addEventListener('scroll', onScroll, { capture: true, passive: true })
          )
        }

        state.orientationHandler = () => onScroll()
        if ('orientation' in screen && 'addEventListener' in screen.orientation) {
          screen.orientation.addEventListener('change', state.orientationHandler)
        } else {
          window.addEventListener('orientationchange', state.orientationHandler)
        }

        state.windowResizeHandler = onResize
        window.addEventListener('resize', onResize)

        if (scroll) {
          state.windowScrollHandler = onScroll
          window.addEventListener('scroll', onScroll, { capture: true, passive: true })
        }
      }

      const ref = (node: HTMLElement | SVGElement | null) => {
        if (!node || node === state.element) return
        removeListeners()
        state.element          = node
        state.scrollContainers = findScrollContainers(node)
        addListeners()
        measure()
      }

      const forceRefresh = () => measure()

      // wire cleanup
      if (!state.cleanup) {
        state.cleanup = () => {
          removeListeners()
          if (state.debounceTimer) clearTimeout(state.debounceTimer)
        }
      }

      return [ref, state.bounds, forceRefresh]
    }
  )
}

export default useMeasure
