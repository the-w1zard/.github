import { createHook } from '#the-cloud'

export function useToggle(initialValue = false,  __sauron_id__ = _sid()) {
  return createHook(
    "useToggle",
     __sauron_id__,

    () => ({
      value: {
        current: initialValue
      }
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      const setValue = (v: boolean | ((prev: boolean) => boolean)) => {
        s.current = typeof v === "function" ? v(s.current) : v
        notify(key)
      }

      const toggle = () => setValue(prev => !prev)
      const setTrue = () => setValue(true)
      const setFalse = () => setValue(false)
      const getValue = () => s.current

      return [
        s.current,
        toggle,
        setTrue,
        setFalse,
        getValue
      ] as const
    }
  )
}
