import { createHook } from '#the-cloud'

export function useObjectState(initialState: Record<string, any> = {}) {
  return createHook(
    "useObjectState",
    _sid(),

    () => ({
      value: { ...initialState }
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      const setObjectState = (next: any) => {
        const prev = s.value
        const resolved =
          typeof next === "function" ? next(prev) : next

        s.value = { ...prev, ...resolved }
        notify(key)
      }

      const patch = (partial: Record<string, any>) => {
        s.value = { ...s.value, ...partial }
        notify(key)
      }

      const reset = () => {
        s.value = { ...initialState }
        notify(key)
      }

      const getState = () => s.value

      return [s.value, setObjectState, patch, reset, getState]
    }
  )
}
