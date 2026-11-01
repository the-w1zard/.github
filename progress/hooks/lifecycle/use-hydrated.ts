
// ───────────────────────────────────────────────
// useHydrated — Sauron‑native rewrite
// No React, no useSyncExternalStore
// SSR → false
// First client render → false
// After hydration → true forever
// ───────────────────────────────────────────────

let HYDRATED = false

if (typeof window !== 'undefined') {
  // Flip immediately on first client execution
  HYDRATED = true
}

export function useHydrated(__sauron_id__ = _sid()): boolean {
  return createHook(
    'useHydrated',
    __sauron_id__,

    // initializer
    () => ({
      value: HYDRATED
    }),

    // updater
    () => HYDRATED
  )
}
