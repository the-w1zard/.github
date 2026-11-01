import {  createHook,  notifyHook } from '#the-cloud'

export function useCounter(initialValue = 0, options: { min?: number; max?: number } = {}, __sauron_id__ = _sid()) {
  return createHook(
    'useCounter',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => ({
      value: initialValue
    }),

    // ───────────────────────────────────────── updater
    (hook, key) => {
      const { min, max } = options

      const increment = () => {
        const next = hook.value + 1
        if (max !== undefined && next > max) return
        hook.value = next
        notifyHook(key)
      }

      const decrement = () => {
        const next = hook.value - 1
        if (min !== undefined && next < min) return
        hook.value = next
        notifyHook(key)
      }

      const reset = () => {
        hook.value = initialValue
        notifyHook(key)
      }

      const set = (value: number) => {
        hook.value = value
        notifyHook(key)
      }

      const getCount = () => hook.value

      return [hook.value, { increment, decrement, reset, set }, getCount]
    }
  )
}
