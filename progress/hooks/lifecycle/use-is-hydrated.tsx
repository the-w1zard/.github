import {   createHook,   notifyHook } from '#the-cloud'

// ───────────────────────────────────────────────
// useIsHydrated — Sauron‑native rewrite
// SSR → false
// First client tick → true
// No React, no useState/useEffect
// ───────────────────────────────────────────────

let HYDRATED = false
if (typeof window !== 'undefined') HYDRATED = true

export function useIsHydrated(__sauron_id__ = _sid()): boolean {
  return createHook(
    'useIsHydrated',
    __sauron_id__,

    (): HookState => ({
      value: HYDRATED
    }),

    () => HYDRATED
  )
}

// ───────────────────────────────────────────────
// useIsHydratedSync — Sauron version
// Always synchronous, no external store
// ───────────────────────────────────────────────

export function useIsHydratedSync(__sauron_id__ = _sid()): boolean {
  return useIsHydrated(__sauron_id__)
}

// ───────────────────────────────────────────────
// isServer — Sauron version
// ───────────────────────────────────────────────

export function isServer(): boolean {
  return typeof window === 'undefined'
}

// ───────────────────────────────────────────────
// useIsHydratedWithDelay — Sauron version
// Delay before flipping to true
// ───────────────────────────────────────────────

export function useIsHydratedWithDelay(
  delayMs: number = 0,
  __sauron_id__ = _sid()
): boolean {
  return createHook(
    'useIsHydratedWithDelay',
    __sauron_id__,

    (): HookState => ({
      value: {
        hydrated: HYDRATED,
        timer: null as any,
        attached: false,
        cleanup: null as null | (() => void)
      }
    }),

    (hook, key) => {
      const s = hook.value

      if (!s.attached && typeof window !== 'undefined') {
        s.attached = true

        if (delayMs > 0) {
          s.timer = setTimeout(() => {
            s.hydrated = true
            notifyHook(key)
          }, delayMs)
        } else {
          s.hydrated = true
        }

        s.cleanup = () => {
          if (s.timer) clearTimeout(s.timer)
        }
      }

      return s.hydrated
    }
  )
}

// ───────────────────────────────────────────────
// useIsHydratedRef — Sauron version
// ───────────────────────────────────────────────

export function useIsHydratedRef(__sauron_id__ = _sid()): { current: boolean } {
  return createHook(
    'useIsHydratedRef',
    __sauron_id__,

    (): HookState => ({
      value: {
        ref: { current: HYDRATED },
        attached: false
      }
    }),

    (hook) => {
      const s = hook.value

      if (!s.attached && typeof window !== 'undefined') {
        s.attached = true
        s.ref.current = true
      }

      return s.ref
    }
  )
}

// ───────────────────────────────────────────────
// withHydration — Sauron version
// No React, returns a Sauron component wrapper
// ───────────────────────────────────────────────

export function withHydration(Component: any) {
  return function Wrapped(props: any) {
    const hydrated = useIsHydrated()
    return hydrated ? Component(props) : null
  }
}

// ───────────────────────────────────────────────
// ClientOnly — Sauron version
// ───────────────────────────────────────────────

export function ClientOnly({
  children,
  fallback = null
}: {
  children: any
  fallback?: any
}) {
  const hydrated = useIsHydrated()
  return hydrated ? children : fallback
}

export default useIsHydrated
