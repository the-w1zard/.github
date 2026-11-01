import {  createHook,  } from '#the-cloud'
import { useEffectEvent } from '../lifecycle/use-effect-event'

// ───────────────────────────────────────────────
// useEventListener — Sauron‑native rewrite
// No React, no useEffect, no useRef
// Stable callback, deterministic cleanup
// ───────────────────────────────────────────────

export function useEventListener(
  eventName: string,
  handler: (event: any) => void,
  element: any = null,
  __sauron_id__ = _sid()
) {
  return createHook(
    'useEventListener',
    __sauron_id__,

    (): HookState => ({
      value: {
        attached: false,
        cleanup: null as null | (() => void),
        handler,
        element
      }
    }),

    (hook) => {
      const state = hook.value

      const stable = useEffectEvent(state.handler)

      const target =
        state.element ||
        (typeof window !== 'undefined' ? window : null)

      if (!target || !target.addEventListener) return

      if (!state.attached) {
        state.attached = true

        const listener = (event: any) => {
          stable(event)
        }

        target.addEventListener(eventName, listener)

        state.cleanup = () => {
          target.removeEventListener(eventName, listener)
        }
      }

      return undefined
    }
  )
}
