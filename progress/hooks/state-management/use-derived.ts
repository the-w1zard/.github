import {  createHook,  notifyHook } from '#the-cloud'

// ───────────────────────────────────────────────
// useDerived — Sauron‑native rewrite
// No hookSystem, no scheduleRender, no dependency tracker
// Pure computed memo with manual invalidation
// ───────────────────────────────────────────────

export function useDerived<T>(compute: () => T, __sauron_id__ = _sid()): () => T {
  return createHook(
    'useDerived',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => {
      return {
        value: {
          compute,
          dirty: true,
          value: undefined as T | undefined,
          subscribers: new Set<() => void>()
        }
      }
    },

    // ───────────────────────────────────────── updater
    (hook, key) => {
      const state = hook.value

      const markDirty = () => {
        state.dirty = true
        state.subscribers.forEach(fn => fn())
        notifyHook(key)
      }

      const get = () => {
        if (state.dirty) {
          state.value = state.compute()
          state.dirty = false
        }
        return state.value as T
      }

      const subscribe = (fn: () => void) => {
        state.subscribers.add(fn)
        return () => state.subscribers.delete(fn)
      }

      return get
    }
  )
}
