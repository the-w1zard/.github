import {  createHook, notifyHook } from '#the-cloud'

export function useClient(__sauron_id__ = _sid()): boolean {
  return createHook(
    'useClient',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => ({
      value: typeof window !== 'undefined',
      cleanup: null
    }),

    // ───────────────────────────────────────── updater
    (hook, key) => {
      // If already true, nothing to do
      if (hook.value === true) return hook.value

      // Flip to true on first client tick
      if (typeof window !== 'undefined') {
        hook.value = true
        notifyHook(key)
      }

      return hook.value
    }
  )
}
