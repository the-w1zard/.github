import { createHook } from '#the-cloud'
import { _sid } from '#sauron'

interface ViewTransitionState {
  supported: boolean
  active: boolean
}

export function useViewTransition(   __sauron_id__ = _sid()) {
  return createHook(
    "useViewTransition",
     __sauron_id__,

    () => ({
      value: {
        supported:
          typeof document !== "undefined" &&
          "startViewTransition" in document,
        active: false
      } as ViewTransitionState
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      const start = async (updateCallback: () => void) => {
        if (!s.supported) {
          updateCallback()
          return
        }

        try {
          s.active = true
          notify(key)

          const transition = (document as any).startViewTransition(updateCallback)
          await transition.finished

          s.active = false
          notify(key)
        } catch {
          s.active = false
          notify(key)
        }
      }

      return [
        s.supported,
        start,
        () => s.active
      ] as const
    }
  )
}
