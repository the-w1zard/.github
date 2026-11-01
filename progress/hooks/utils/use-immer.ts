import {  createHook,  notifyHook } from '#the-cloud'

// ───────────────────────────────────────────────
// Minimal Immer‑style produce()
// Proxy-based draft, immutable output
// ───────────────────────────────────────────────

function produce<T>(base: T, recipe: (draft: T) => void): T {
  const drafts = new Map<any, any>()
  const changed = new Set<string>()

  const wrap = (obj: any, path: string[] = []): any => {
    if (!obj || typeof obj !== 'object') return obj
    if (drafts.has(obj)) return drafts.get(obj)

    const draft = Array.isArray(obj) ? [...obj] : { ...obj }
    drafts.set(obj, draft)

    return new Proxy(draft, {
      get(t, prop) {
        const v = t[prop]
        return typeof v === 'object' && v !== null
          ? wrap(v, [...path, prop as string])
          : v
      },
      set(t, prop, value) {
        t[prop] = value
        changed.add([...path, prop as string].join('.'))
        return true
      }
    })
  }

  const draft = wrap(base)
  recipe(draft)

  if (changed.size === 0) return base

  const apply = (obj: any, path: string[] = []): any => {
    if (!obj || typeof obj !== 'object') return obj

    const out = Array.isArray(obj) ? [...obj] : { ...obj }

    for (const key in out) {
      const full = [...path, key].join('.')
      if (changed.has(full)) {
        out[key] = draft[key]
      } else {
        out[key] = apply(out[key], [...path, key])
      }
    }

    return out
  }

  return apply(base)
}

// ───────────────────────────────────────────────
// useImmer — Sauron‑native rewrite
// No React, no useSignal, no hookSystem
// Deterministic immutable updates with mutable syntax
// ───────────────────────────────────────────────

export function useImmer<T extends object>(
  initialValue: T | (() => T),
  __sauron_id__ = _sid()
): [T, (recipe: (draft: T) => void) => void] {
  return createHook(
    'useImmer',
    __sauron_id__,

    (): HookState => ({
      value: {
        state:
          typeof initialValue === 'function'
            ? (initialValue as () => T)()
            : initialValue
      }
    }),

    (hook, key) => {
      const s = hook.value

      const set = (recipe: (draft: T) => void) => {
        const next = produce(s.state, recipe)
        if (next !== s.state) {
          s.state = next
          notifyHook(key)
        }
      }

      return [s.state, set]
    }
  )
}
