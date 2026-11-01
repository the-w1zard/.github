import { createHook } from '#the-cloud'

interface StrictEffectState {
  hasRun: boolean
  cleanup: (() => void) | null
  deps?: any[]
}

export function useStrictEffect(
  effect: () => void | (() => void),
  deps: any[],
  __sauron_id__ = _sid()
) {
  return createHook(
    "useStrictEffect",
    __sauron_id__,

    () => ({
      value: {
        hasRun: false,
        cleanup: null,
        deps: undefined
      } as StrictEffectState
    }),

    (state, key, notify) => {
      const s = state.value

      const changed =
        !s.deps ||
        s.deps.length !== deps.length ||
        s.deps.some((d, i) => d !== deps[i])

      if (changed) {
        s.deps = deps

        if (!s.hasRun) {
          s.hasRun = true
          notify(key)
          return []
        }

        if (s.cleanup) s.cleanup()

        const result = effect()
        s.cleanup = typeof result === "function" ? result : null
        notify(key)

        if (!state.cleanup) {
          state.cleanup = () => {
            if (s.cleanup) s.cleanup()
          }
        }
      }

      return []
    }
  )
}
