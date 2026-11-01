import { _sid, createHook, HookState, notifyHook } from '#the-cloud'

export function useBeforeUnload(
  fn: (event: BeforeUnloadEvent) => void,
  options?: { capture?: boolean },
  __sauron_id__ = _sid()
) {
  return createHook(
    'useBeforeUnload',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => {
      const hook: HookState & {
        handler: (e: BeforeUnloadEvent) => void
        capture: boolean
      } = {
        value: undefined,
        handler: fn,
        capture: options?.capture ?? false,
        cleanup() {
          if (typeof window === 'undefined') return
          window.removeEventListener('beforeunload', hook.handler, { capture: hook.capture })
        }
      }

      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', hook.handler, { capture: hook.capture })
      }

      return hook
    },

    // ───────────────────────────────────────── updater
   // ───────────────────────────────────────── updater
    (hookState, key) => {
      const hook = hookState as HookState & {
        handler: (e: BeforeUnloadEvent) => void
        capture: boolean
      }
      const nextCapture = options?.capture ?? false

      if (hook.handler !== fn || hook.capture !== nextCapture) {
        if (typeof window !== 'undefined') {
          window.removeEventListener('beforeunload', hook.handler, { capture: hook.capture })
          hook.handler = fn
          hook.capture = nextCapture
          window.addEventListener('beforeunload', hook.handler, { capture: hook.capture })
        }
        notifyHook(key)
      }

      return undefined
    }
  )
}
