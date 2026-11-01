import {   createHook,   } from '#the-cloud'
import { useEffectEvent } from '#sauron'

// ───────────────────────────────────────────────
// useEvent — Sauron‑native rewrite
// No React, no useEffect, no hookSystem
// Stable callback, deterministic cleanup
// ───────────────────────────────────────────────

export function useEvent(
  eventName: string,
  handler: (event: any) => void,
  target: any = null,
  options: AddEventListenerOptions | boolean = {},
  __sauron_id__ = _sid()
) {
  return createHook(
    'useEvent',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => ({
      value: {
        attached: false,
        cleanup: null as null | (() => void),
        handler,
        target
      }
    }),

    // ───────────────────────────────────────── updater
    (hook) => {
      const state = hook.value

      const stable = useEffectEvent(state.handler)

      const eventTarget =
        state.target ||
        (typeof window !== 'undefined' ? window : null)

      if (!eventTarget || !eventTarget.addEventListener) return

      if (!state.attached) {
        state.attached = true

        const listener = (event: any) => {
          stable(event)
        }

        eventTarget.addEventListener(eventName, listener, options)

        state.cleanup = () => {
          eventTarget.removeEventListener(eventName, listener, options)
        }
      }

      return undefined
    }
  )
}
