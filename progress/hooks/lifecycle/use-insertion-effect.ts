
// ───────────────────────────────────────────────
// useInsertionEffect — Sauron‑native rewrite
// No React, no useLayoutEffect, no hookSystem
// Runs immediately during hook update phase
// Useful for CSS‑in‑JS style pre‑layout mutations
// ───────────────────────────────────────────────

export function useInsertionEffect(
  effect: () => void | (() => void),
  deps: any[] = [],
  __sauron_id__ = _sid()
) {
  return createHook(
    'useInsertionEffect',
    __sauron_id__,

    () => ({
      value: {
        deps: undefined as any[] | undefined,
        cleanup: null as null | (() => void)
      }
    }),

    (hook) => {
      const s = hook.value

      const changed =
        !s.deps ||
        deps.length !== s.deps.length ||
        deps.some((d, i) => d !== s.deps![i])

      if (changed) {
        if (s.cleanup) s.cleanup()

        const cleanup = effect()
        s.cleanup = typeof cleanup === 'function' ? cleanup : null
        s.deps = deps
      }
    }
  )
}
