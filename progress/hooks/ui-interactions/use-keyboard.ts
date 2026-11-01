import { createHook, notifyHook } from '#the-cloud'

// ───────────────────────────────────────────────
// useKeyboard — Sauron‑native rewrite
// No React, no useState, no useEffect, no hookSystem
// Deterministic key‑combo matcher with stable state
// ───────────────────────────────────────────────

export function useKeyboard(
  keyCombo: string,
  handler: (e: KeyboardEvent) => void,
  options: any = {},
  __sauron_id__ = _sid()
) {
  return createHook(
    'useKeyboard',
    __sauron_id__,

    (): HookState => ({
      value: {
        pressed: false,
        attached: false,
        cleanup: null as null | (() => void)
      }
    }),

    (hook, key) => {
      const s = hook.value

      const parse = (combo: string) => {
        const keys = combo.split('+').map((k) => k.trim().toLowerCase())
        return {
          ctrl: keys.includes('ctrl'),
          shift: keys.includes('shift'),
          alt: keys.includes('alt'),
          meta: keys.includes('meta'),
          key: keys.find((k) => !['ctrl', 'shift', 'alt', 'meta'].includes(k))
        }
      }

      const combo = parse(keyCombo)

      const matches = (e: KeyboardEvent) =>
        (!combo.ctrl || e.ctrlKey) &&
        (!combo.shift || e.shiftKey) &&
        (!combo.alt || e.altKey) &&
        (!combo.meta || e.metaKey) &&
        (!combo.key || e.key.toLowerCase() === combo.key)

      if (!s.attached && typeof window !== 'undefined') {
        s.attached = true

        const down = (e: KeyboardEvent) => {
          if (!matches(e)) return
          e.preventDefault()
          s.pressed = true
          handler(e)
          notifyHook(key)
        }

        const up = () => {
          if (!s.pressed) return
          s.pressed = false
          notifyHook(key)
        }

        window.addEventListener('keydown', down)
        window.addEventListener('keyup', up)

        s.cleanup = () => {
          window.removeEventListener('keydown', down)
          window.removeEventListener('keyup', up)
        }
      }

      const isPressed = () => s.pressed

      return [s.pressed, isPressed]
    }
  )
}
