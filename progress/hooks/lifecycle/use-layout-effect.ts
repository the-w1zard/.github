

export function useLayoutEffect(
  effect: () => void | (() => void),
  deps?: any[],
  __sauron_id__ = _sid()
): void {
  createHook(
    'useLayoutEffect',
    __sauron_id__,
    (): HookState => {
      const cleanup = effect()
      return { value: undefined, deps: deps ?? [], cleanup: (cleanup || undefined) as (() => void) | undefined }
    },
    (state) => {
      if (deps === undefined || !_depsEqual(state.deps ?? [], deps)) {
        state.cleanup?.()
        const cleanup = effect()
        state.deps    = deps ?? []
        state.cleanup = (cleanup || undefined) as (() => void) | undefined
      }
      return undefined
    }
  )
}

function _depsEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false
  }
  return true
}

/**import { _sid, createHook, HookState } from '#the-cloud'

// ───────────────────────────────────────────────
// useLayoutEffect — Sauron‑native rewrite
// No React, no useState, no useEffect, no hookSystem
// Runs effect immediately on server
// Runs in a microtask on client (layout‑safe)
// Deterministic deps + cleanup
// ───────────────────────────────────────────────

export function useLayoutEffect(
  effect: () => void | (() => void),
  deps: any[] = [],
  __sauron_id__ = _sid()
) {
  return createHook(
    'useLayoutEffect',
    __sauron_id__,

    (): HookState => ({
      value: {
        deps: undefined as any[] | undefined,
        cleanup: null as null | (() => void)
      }
    }),

    (hook) => {
      const s = hook.value

      const changed =
        !s.deps ||
        !deps ||
        deps.length !== s.deps.length ||
        deps.some((d, i) => d !== s.deps![i])

      if (!changed) return

      if (s.cleanup) s.cleanup()

      if (typeof window !== 'undefined') {
        queueMicrotask(() => {
          const c = effect()
          s.cleanup = typeof c === 'function' ? c : null
        })
      } else {
        const c = effect()
        s.cleanup = typeof c === 'function' ? c : null
      }

      s.deps = deps || []
    }
  )
}
 */
