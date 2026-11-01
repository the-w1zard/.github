import {  createHook,  notifyHook } from '#the-cloud'

export function useComputed(fn: () => any, deps: any[] = [], __sauron_id__ = _sid()) {
  return createHook(
    'useComputed',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => ({
      value: fn()
    }),

    // ───────────────────────────────────────── updater
    (hook, key) => {
      const next = fn()
      if (next !== hook.value) {
        hook.value = next
        notifyHook(key)
      }

      const getValue = () => hook.value

      return [hook.value, getValue]
    }
  )
}
