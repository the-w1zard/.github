import {  createHook, notifyHook } from '#the-cloud'

// ───────────────────────────────────────────────
// useIntersection — Sauron‑native rewrite
// No React, no useState, no useEffect, no hookSystem
// Deterministic IntersectionObserver with stable ref setter
// ───────────────────────────────────────────────

export function useIntersection(
  options: {
    threshold?: number
    root?: Element | null
    rootMargin?: string
    once?: boolean
  } = {},
  __sauron_id__ = _sid()
) {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    once = false
  } = options

  return createHook(
    'useIntersection',
    __sauron_id__,

    (): HookState => ({
      value: {
        ref: null as HTMLElement | null,
        entry: null as IntersectionObserverEntry | null,
        isIntersecting: false,
        intersectionRatio: 0,
        observer: null as IntersectionObserver | null,
        attached: false,
        cleanup: null as null | (() => void)
      }
    }),

    (hook, key) => {
      const s = hook.value

      const setRef = (el: HTMLElement | null) => {
        s.ref = el
        notifyHook(key)
      }

      if (!s.attached && typeof window !== 'undefined') {
        s.attached = true

        if (s.ref) {
          s.observer = new IntersectionObserver(
            (entries) => {
              const entry = entries[0]
              s.entry = entry
              s.isIntersecting = entry.isIntersecting
              s.intersectionRatio = entry.intersectionRatio

              notifyHook(key)

              if (once && entry.isIntersecting) {
                s.observer!.disconnect()
              }
            },
            { threshold, root, rootMargin }
          )

          s.observer.observe(s.ref)
        }

        s.cleanup = () => {
          if (s.observer) s.observer.disconnect()
        }
      }

      const getIsIntersecting = () => s.isIntersecting
      const getEntry = () => s.entry

      return [
        setRef,
        {
          isIntersecting: s.isIntersecting,
          intersectionRatio: s.intersectionRatio,
          entry: s.entry
        },
        getIsIntersecting,
        getEntry
      ]
    }
  )
}
