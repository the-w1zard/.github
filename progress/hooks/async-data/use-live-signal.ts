import { _sid, createHook, HookState, notifyHook } from '#the-cloud'

// ───────────────────────────────────────────────
// useLiveSignal — Sauron‑native rewrite
// No React, no useState, no useEffect, no hookSystem
// Mirrors an external signal into a local hook state
// Keeps local state in sync via externalSignal.subscribe
// ───────────────────────────────────────────────

export function useLiveSignal<T>(
  externalSignal: { value: T; subscribe?: (fn: (v: T) => void) => () => void },
  __sauron_id__ = _sid()
) {
  return createHook(
    'useLiveSignal',
    __sauron_id__,

    (): HookState => ({
      value: {
        local: externalSignal.value,
        cleanup: null as null | (() => void),
        attached: false
      }
    }),

    (hook, key) => {
      const s = hook.value

      const setLocal = (v: T) => {
        s.local = v
        notifyHook(key)
      }

      const getLocal = () => s.local

      if (!s.attached) {
        s.attached = true

        if (externalSignal.subscribe) {
          const unsub = externalSignal.subscribe(setLocal)
          s.cleanup = typeof unsub === 'function' ? unsub : null
        }
      }

      return [s.local, setLocal, getLocal]
    }
  )
}
