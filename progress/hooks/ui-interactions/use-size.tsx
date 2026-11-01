import { createHook } from '#the-cloud'

export interface Size {
  width: number
  height: number
}

export function useSize(
  element: HTMLElement | null,
  __sauron_id__ = _sid()
): Size | undefined {
  return createHook(
    "useSize",
    __sauron_id__,

    () => ({
      value: {
        size: undefined as Size | undefined,
        element
      }
    }),

    (state, key, notify) => {
      const s = state.value

      // update element reference
      s.element = element

      // cleanup observer on unmount
      if (!state.cleanup) {
        state.cleanup = () => {
          if (s._observer) {
            s._observer.disconnect()
          }
          if (s._timeout) {
            clearTimeout(s._timeout)
          }
        }
      }

      // no DOM available
      if (typeof window === "undefined" || typeof document === "undefined") {
        s.size = undefined
        return s.size
      }

      // element is null → reset
      if (!s.element) {
        s.size = undefined
        notify(key)
        return s.size
      }

      // initial size
      const initialWidth = s.element.offsetWidth
      const initialHeight = s.element.offsetHeight
      const initial = { width: initialWidth, height: initialHeight }

      if (
        !s.size ||
        s.size.width !== initial.width ||
        s.size.height !== initial.height
      ) {
        s.size = initial
        notify(key)
      }

      // ResizeObserver available
      if (typeof window.ResizeObserver !== "undefined") {
        if (!s._observer) {
          s._observer = new ResizeObserver(entries => {
            if (!entries.length) return
            const entry = entries[0]

            let width: number
            let height: number

            if ("borderBoxSize" in entry) {
              const box = Array.isArray(entry.borderBoxSize)
                ? entry.borderBoxSize[0]
                : entry.borderBoxSize
              width = box.inlineSize
              height = box.blockSize
            } else {
              width = s.element!.offsetWidth
              height = s.element!.offsetHeight
            }

            if (!s.size || s.size.width !== width || s.size.height !== height) {
              s.size = { width, height }
              notify(key)
            }
          })

          s._observer.observe(s.element, { box: "border-box" })
        }

        return s.size
      }

      // fallback polling
      if (!s._timeout) {
        const poll = () => {
          if (s.element && s.element.isConnected) {
            const w = s.element.offsetWidth
            const h = s.element.offsetHeight

            if (!s.size || s.size.width !== w || s.size.height !== h) {
              s.size = { width: w, height: h }
              notify(key)
            }

            s._timeout = setTimeout(poll, 200)
          }
        }

        poll()
      }

      return s.size
    }
  )
}
