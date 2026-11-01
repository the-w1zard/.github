import { createHook } from '#the-cloud'

export function useResize(options: any = {}) {
  const { box = "content-box", throttle = false } = options

  return createHook(
    "useResize",
    _sid(),

    () => ({
      width: 0,
      height: 0,
      entry: null as ResizeObserverEntry | null,
      rafId: null as number | null,
      root: null as HTMLElement | null,
      observer: null as ResizeObserver | null,
      initialized: false
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      const setRef = (node: HTMLElement | null) => {
        s.root = node

        if (s.observer) {
          s.observer.disconnect()
          s.observer = null
        }

        if (!node || typeof window === "undefined") {
          notify(key)
          return
        }

        const obs = new ResizeObserver((entries) => {
          const entry = entries[0]

          const update = () => {
            s.entry = entry
            s.width = entry.contentRect.width
            s.height = entry.contentRect.height
            notify(key)
          }

          if (throttle) {
            if (s.rafId) cancelAnimationFrame(s.rafId)
            s.rafId = requestAnimationFrame(update)
          } else {
            update()
          }
        })

        s.observer = obs
        obs.observe(node, { box })
        notify(key)
      }

      if (!s.initialized) {
        s.initialized = true
        hookState.cleanup = () => {
          if (s.observer) s.observer.disconnect()
          if (s.rafId) cancelAnimationFrame(s.rafId)
        }
      }

      const getDimensions = () => ({
        width: s.width,
        height: s.height
      })

      return [setRef, { width: s.width, height: s.height }, getDimensions] as const
    }
  )
}
