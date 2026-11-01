import {  createHook,   } from '#the-cloud'

interface ClickOutsideOptions {
  events?: Array<'mousedown' | 'mouseup' | 'click' | 'touchstart' | 'touchend'>
  ignore?: string[]
  capture?: boolean
  enabled?: boolean
}


export function useClickOutsideMulti(
  refs: { current: HTMLElement | null }[],
  handler: (event: MouseEvent | TouchEvent) => void,
  options: ClickOutsideOptions = {},
  __sauron_id__ = _sid()
) {
  const {
    events = ['mousedown', 'touchstart'],
    ignore = [],
    capture = false,
    enabled = true
  } = options

  return createHook(
    'useClickOutsideMulti',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => ({
      value: {
        refs,
        handler,
        events,
        ignore,
        capture,
        enabled,
        listener: null as any
      },
      cleanup() {
        const v = (this as any).value
        if (v.listener) {
          v.events.forEach(e =>
            document.removeEventListener(e, v.listener, { capture: v.capture })
          )
        }
      }
    }),

    // ───────────────────────────────────────── updater
    (hook) => {
      const v = hook.value

      if (!v.enabled) return null

      if (v.listener) {
        v.events.forEach(e =>
          document.removeEventListener(e, v.listener, { capture: v.capture })
        )
      }

      v.listener = (event: MouseEvent | TouchEvent) => {
        const target = event.target as Node

        for (const r of v.refs) {
          if (r.current?.contains(target)) return
        }

        for (const selector of v.ignore) {
          if ((target as Element).matches?.(selector)) return
        }

        v.handler(event)
      }

      v.events.forEach(e =>
        document.addEventListener(e, v.listener, { capture: v.capture })
      )

      return null
    }
  )
}
