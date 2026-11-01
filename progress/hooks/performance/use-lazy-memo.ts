

// ───────────────────────────────────────────────
// useLazyMemo — Sauron‑native rewrite
// No React, no useState, no useEffect, no hookSystem
// Lazy evaluation + dependency tracking
// Recomputes only when deps change
// ───────────────────────────────────────────────

export function useLazyMemo<T>(
  factory: () => T,
  deps: any[] = [],
  __sauron_id__ = _sid()
): () => T {
  return createHook(
    'useLazyMemo',
    __sauron_id__,

    (): HookState => ({
      value: {
        factory,
        deps,
        value: null as T | null,
        dirty: true
      }
    }),

    (hook) => {
      const s = hook.value

      const changed =
        !s.deps ||
        deps.length !== s.deps.length ||
        deps.some((d, i) => d !== s.deps![i])

      const getValue = () => {
        if (s.dirty || changed) {
          s.value = s.factory()
          s.deps = deps
          s.dirty = false
        }
        return s.value as T
      }

      return getValue
    }
  )
}
