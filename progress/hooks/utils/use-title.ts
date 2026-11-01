import { createHook } from '#the-cloud'

interface TitleState {
  previous: string
  deps?: any[]
}

export function useTitle(title: string, options: { restoreOnUnmount?: boolean } = {},  __sauron_id__ = _sid()) {
  const { restoreOnUnmount = false } = options

  return createHook(
    "useTitle",
     __sauron_id__,

    () => ({
      value: {
        previous:
          typeof document !== "undefined"
            ? document.title
            : "",
        deps: undefined
      } as TitleState
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      const deps = [title]
      const changed =
        !s.deps ||
        s.deps.length !== deps.length ||
        s.deps.some((d, i) => d !== deps[i])

      if (changed && typeof document !== "undefined") {
        s.deps = deps
        document.title = title

        if (!hookState.cleanup) {
          hookState.cleanup = () => {
            if (restoreOnUnmount) {
              document.title = s.previous
            }
          }
        }
      }

      return []
    }
  )
}
