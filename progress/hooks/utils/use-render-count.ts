import { createHook } from '#the-cloud'

export function useRenderCount() {
  return createHook(
    "useRenderCount",
    _sid(),

    () => ({
      count: 0
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      s.count++
      notify(key)

      const getCount = () => s.count

      return [s.count, getCount] as const
    }
  )
}
