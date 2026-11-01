import {  createHook,  notifyHook } from '#the-cloud'

// ───────────────────────────────────────────────
// Global invalidation registry
// ───────────────────────────────────────────────

type InvalidationRule = {
  key: string | RegExp
  dependencies: string[]
  invalidate: (keys: string[]) => void
}

const invalidationRules: InvalidationRule[] = []
const invalidationSubscribers = new Set<(keys: string[]) => void>()

// ───────────────────────────────────────────────
// useInvalidate — Sauron‑native rewrite
// No React, no useEffect, no hookSystem
// Deterministic cross‑component invalidation
// ───────────────────────────────────────────────

export function useInvalidate(__sauron_id__ = _sid()) {
  return createHook(
    'useInvalidate',
    __sauron_id__,

    (): HookState => ({
      value: {
        invalidated: new Set<string>(),
        attached: false,
        cleanup: null as null | (() => void)
      }
    }),

    (hook, key) => {
      const s = hook.value

      const invalidate = (keys: string | string[]) => {
        const arr = Array.isArray(keys) ? keys : [keys]

        invalidationSubscribers.forEach((fn) => fn(arr))

        invalidationRules.forEach((rule) => {
          const matches = arr.filter((k) =>
            typeof rule.key === 'string' ? k === rule.key : rule.key.test(k)
          )
          if (matches.length > 0) {
            rule.invalidate(rule.dependencies)
          }
        })
      }

      const addRule = (rule: Omit<InvalidationRule, 'invalidate'>) => {
        invalidationRules.push({
          ...rule,
          invalidate: (keys) => {
            invalidationSubscribers.forEach((fn) => fn(keys))
          }
        })
      }

      if (!s.attached) {
        s.attached = true

        const subscriber = (keys: string[]) => {
          keys.forEach((k) => s.invalidated.add(k))
          notifyHook(key)
        }

        invalidationSubscribers.add(subscriber)

        s.cleanup = () => {
          invalidationSubscribers.delete(subscriber)
        }
      }

      return { invalidate, addRule }
    }
  )
}

// ───────────────────────────────────────────────
// createInvalidationGraph — unchanged logic
// ───────────────────────────────────────────────

export function createInvalidationGraph() {
  const graph = new Map<string, Set<string>>()

  return {
    addDependency: (key: string, dependsOn: string) => {
      if (!graph.has(key)) graph.set(key, new Set())
      graph.get(key)!.add(dependsOn)
    },

    getDependents: (key: string): string[] => {
      const out: string[] = []
      graph.forEach((deps, k) => {
        if (deps.has(key)) out.push(k)
      })
      return out
    },

    invalidate: (key: string): string[] => {
      const out = new Set<string>([key])

      const walk = (k: string) => {
        const deps = graph.get(k)
        if (!deps) return
        deps.forEach((d) => {
          if (!out.has(d)) {
            out.add(d)
            walk(d)
          }
        })
      }

      walk(key)
      return [...out]
    }
  }
}
