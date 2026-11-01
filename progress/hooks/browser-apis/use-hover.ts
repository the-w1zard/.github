import { _sid, createHook, HookState, notifyHook } from '#the-cloud'

// ───────────────────────────────────────────────
// useHover — Sauron‑native rewrite
// No React, no useEffect, no useState, no hookSystem
// Stable ref setter, deterministic DOM binding
// ───────────────────────────────────────────────

export function useHover(__sauron_id__ = _sid()) {
  return createHook(
    'useHover',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => ({
      value: {
        isHovering: false,
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

      const enter = () => {
        s.isHovering = true
        notifyHook(key)
      }

      const leave = () => {
        s.isHovering = false
        notifyHook(key)
      }

      if (!s.attached && typeof document !== 'undefined') {
        s.attached = true

        if (s.ref) {
          s.ref.addEventListener('mouseenter', enter)
          s.ref.addEventListener('mouseleave', leave)
        }

        s.cleanup = () => {
          if (s.ref) {
            s.ref.removeEventListener('mouseenter', enter)
            s.ref.removeEventListener('mouseleave', leave)
          }
        }
      }

      const getIsHovering = () => s.isHovering

      return [setRef, s.isHovering, getIsHovering]
    }
  )
}
