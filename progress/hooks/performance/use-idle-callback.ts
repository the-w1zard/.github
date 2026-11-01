import {   createHook,   notifyHook } from '#the-cloud'

// ───────────────────────────────────────────────
// useIdleCallback — Sauron‑native rewrite
// No React, no useEffect, no hookSystem
// Deterministic idle scheduling with fallback
// ───────────────────────────────────────────────

export function useIdleCallback(
  callback: (...args: any[]) => void,
  options: { timeout?: number; immediate?: boolean } = {},
  __sauron_id__ = _sid()
) {
  const { timeout = 2000, immediate = false } = options

  return createHook(
    'useIdleCallback',
    __sauron_id__,

    (): HookState => ({
      value: {
        callback,
        timeout,
        scheduled: false,
        handle: null as any,
        supported:
          typeof window !== 'undefined' &&
          typeof (window as any).requestIdleCallback === 'function',
        attached: false,
        cleanup: null as null | (() => void)
      }
    }),

    (hook, key) => {
      const s = hook.value

      const schedule = (...args: any[]) => {
        if (!s.supported) {
          s.handle = setTimeout(() => {
            s.callback(...args)
            s.scheduled = false
            notifyHook(key)
          }, s.timeout)
          s.scheduled = true
          notifyHook(key)
          return
        }

        s.scheduled = true
        notifyHook(key)

        s.handle = (window as any).requestIdleCallback(
          (deadline: IdleDeadline) => {
            s.callback(deadline, ...args)
            s.scheduled = false
            notifyHook(key)
          },
          { timeout: s.timeout }
        )
      }

      const cancel = () => {
        if (!s.handle) return

        if (s.supported) {
          ;(window as any).cancelIdleCallback(s.handle)
        } else {
          clearTimeout(s.handle)
        }

        s.scheduled = false
        s.handle = null
        notifyHook(key)
      }

      if (!s.attached) {
        s.attached = true
        if (immediate) schedule()
        s.cleanup = cancel
      }

      const isScheduled = () => s.scheduled

      return [schedule, cancel, isScheduled]
    }
  )
}
