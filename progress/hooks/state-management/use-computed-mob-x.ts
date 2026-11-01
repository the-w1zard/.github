import {  createHook,   notifyHook } from '#the-cloud'
import { signal } from '#the-cloud'

export function useComputedMobX(fn: () => any, deps: any[] = [], __sauron_id__ = _sid()) {
  return createHook(
    'useComputedMobX',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => {
      const value = signal(fn())
      return { value }
    },

    // ───────────────────────────────────────── updater
    (hook, key) => {
      const compute = () => {
        const next = fn()
        if (next !== hook.value.value) {
          hook.value.value = next
          notifyHook(key)
        }
      }

      compute()

      return hook.value
    }
  )
}
