
// ───────────────────────────────────────────────
// useIsomorphicEffect — Sauron‑native rewrite
// No React, no useLayoutEffect, no useEffect, no hookSystem
// Runs immediately on client, no‑op on server
// ───────────────────────────────────────────────

export function useIsomorphicEffect(
  effect: () => void | (() => void),
  deps: any[] = [],
  __sauron_id__ = _sid()
) {
  return createHook(
    'useIsomorphicEffect',
    __sauron_id__,

    () => ({
      value: {
        deps: undefined as any[] | undefined,
        cleanup: null as null | (() => void),
        attached: false
      }
    }),

    (hook) => {
      const s = hook.value
      const isServer = typeof window === 'undefined'

      if (isServer) return

      const changed =
        !s.deps ||
        deps.length !== s.deps.length ||
        deps.some((d, i) => d !== s.deps![i])

      if (!s.attached || changed) {
        if (s.cleanup) s.cleanup()

        const cleanup = effect()
        s.cleanup = typeof cleanup === 'function' ? cleanup : null
        s.deps = deps
        s.attached = true
      }
    }
  )
}
