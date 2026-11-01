import { createHook } from '#the-cloud'
import { _sid } from '#sauron'

interface VisibleTaskState {
  ref: Node | null
  hasRun: boolean
  deps?: any[]
}

export function useVisibleTask(fn: () => void, options: IntersectionObserverInit = {},  __sauron_id__ = _sid()) {
  return createHook(
    "useVisibleTask",
    __sauron_id__,

    () => ({
      value: {
        ref: null,
        hasRun: false,
        deps: undefined
      } as VisibleTaskState
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      const setRef = (node: Node | null) => {
        s.ref = node
        notify(key)
      }

      const deps = [s.ref, s.hasRun]
      const changed =
        !s.deps ||
        s.deps.length !== deps.length ||
        s.deps.some((d, i) => d !== deps[i])

      if (changed) {
        s.deps = deps

        if (typeof window !== "undefined" && s.ref && !s.hasRun) {
          const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting && !s.hasRun) {
                fn()
                s.hasRun = true
                notify(key)
                observer.disconnect()
              }
            }
          }, options)

          observer.observe(s.ref)

          if (!hookState.cleanup) {
            hookState.cleanup = () => observer.disconnect()
          }
        }
      }

      return setRef
    }
  )
}
