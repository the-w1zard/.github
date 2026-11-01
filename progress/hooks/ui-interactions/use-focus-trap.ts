import {  createHook,notifyHook } from '#the-cloud'

// ───────────────────────────────────────────────
// useFocusTrap — Sauron‑native rewrite
// No React, no useEffect, no useState, no hookSystem
// Deterministic DOM binding, stable ref setter, stable activate/deactivate
// ───────────────────────────────────────────────

export function useFocusTrap(
  options: { active?: boolean; initialFocus?: boolean } = {},
  __sauron_id__ = _sid()
) {
  const { active = true, initialFocus = true } = options

  return createHook(
    'useFocusTrap',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => ({
      value: {
        active,
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

      const getFocusable = () => {
        if (!s.ref) return []
        const selector = [
          'a[href]',
          'button:not([disabled])',
          'input:not([disabled])',
          'select:not([disabled])',
          'textarea:not([disabled])',
          '[tabindex]:not([tabindex="-1"])',
          'area[href]',
          'iframe',
          'object',
          'embed',
          '[contenteditable]'
        ].join(',')
        return Array.from(s.ref.querySelectorAll(selector)) as HTMLElement[]
      }

      const trap = (e: KeyboardEvent) => {
        if (!s.active || !s.ref) return
        if (e.key !== 'Tab') return

        const list = getFocusable()
        if (list.length === 0) return

        const first = list[0]
        const last = list[list.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }

      if (!s.attached && typeof document !== 'undefined') {
        s.attached = true

        if (s.active && initialFocus && s.ref) {
          const list = getFocusable()
          if (list.length > 0) {
            list[0].focus()
          } else {
            s.ref.setAttribute('tabindex', '-1')
            s.ref.focus()
          }
        }

        document.addEventListener('keydown', trap)

        s.cleanup = () => {
          document.removeEventListener('keydown', trap)
        }
      }

      const activate = () => {
        s.active = true
        notifyHook(key)
      }

      const deactivate = () => {
        s.active = false
        notifyHook(key)
      }

      return [setRef, s.active, activate, deactivate]
    }
  )
}
