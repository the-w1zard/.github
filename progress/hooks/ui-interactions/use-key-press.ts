import {  createHook,  notifyHook } from '#the-cloud'

// ───────────────────────────────────────────────
// useKeyPress — Sauron‑native rewrite
// No React, no useState, no useEffect, no hookSystem
// Deterministic keydown/keyup tracking with stable state
// ───────────────────────────────────────────────

export function useKeyPress(
  targetKey: string,
  handler: { onDown?: (e: KeyboardEvent) => void; onUp?: (e: KeyboardEvent) => void } | null,
  options: { keyCode?: number } = {},
  __sauron_id__ = _sid()
) {
  return createHook(
    'useKeyPress',
    __sauron_id__,

    (): HookState => ({
      value: {
        keyPressed: false,
        attached: false,
        cleanup: null as null | (() => void)
      }
    }),

    (hook, key) => {
      const s = hook.value

      const matches = (e: KeyboardEvent) =>
        e.key === targetKey || (options.keyCode && e.keyCode === options.keyCode)

      if (!s.attached && typeof window !== 'undefined') {
        s.attached = true

        const down = (e: KeyboardEvent) => {
          if (!matches(e)) return
          s.keyPressed = true
          handler?.onDown?.(e)
          notifyHook(key)
        }

        const up = (e: KeyboardEvent) => {
          if (!matches(e)) return
          s.keyPressed = false
          handler?.onUp?.(e)
          notifyHook(key)
        }

        window.addEventListener('keydown', down)
        window.addEventListener('keyup', up)

        s.cleanup = () => {
          window.removeEventListener('keydown', down)
          window.removeEventListener('keyup', up)
        }
      }

      const getKeyPressed = () => s.keyPressed

      return [s.keyPressed, getKeyPressed]
    }
  )
}
