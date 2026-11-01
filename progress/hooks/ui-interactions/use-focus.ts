import {  createHook, notifyHook } from '#the-cloud'

// ───────────────────────────────────────────────
// useFocus — Sauron‑native rewrite
// No React, no useEffect, no useState, no hookSystem
// Stable ref setter, deterministic DOM binding
// ───────────────────────────────────────────────

export function useFocus(initialFocused = false, __sauron_id__ = _sid()) {
  return createHook(
    'useFocus',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => ({
      value: {
        focused: initialFocused,
        ref: null as HTMLElement | null,
        attached: false,
        cleanup: null as null | (() => void)
      }
    }),

    // ───────────────────────────────────────── updater
    (hook, key) => {
      const s = hook.value

      const setRef = (el: HTMLElement | null) => {
        s.ref = el
        notifyHook(key)
      }

      const focus = () => {
        s.ref?.focus()
        s.focused = true
        notifyHook(key)
      }

      const blur = () => {
        s.ref?.blur()
        s.focused = false
        notifyHook(key)
      }

      const onFocus = () => {
        s.focused = true
        notifyHook(key)
      }

      const onBlur = () => {
        s.focused = false
        notifyHook(key)
      }

      if (!s.attached && typeof document !== 'undefined') {
        s.attached = true

        if (s.ref) {
          s.ref.addEventListener('focus', onFocus)
          s.ref.addEventListener('blur', onBlur)
        }

        s.cleanup = () => {
          if (s.ref) {
            s.ref.removeEventListener('focus', onFocus)
            s.ref.removeEventListener('blur', onBlur)
          }
        }
      }

      const getFocused = () => s.focused

      return [setRef, s.focused, focus, blur, getFocused]
    }
  )
}
