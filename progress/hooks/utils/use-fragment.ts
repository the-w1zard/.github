import {  createHook, } from '#the-cloud'

// ───────────────────────────────────────────────
// Fragment helpers (unchanged)
// ───────────────────────────────────────────────

export type Fragment<T, R> = {
  __type: 'fragment'
  __key: string
  __deps: string[]
  extract: (data: T) => R
}

export function createFragment<T, R>(
  key: string,
  extract: (data: T) => R,
  deps: string[] = []
): Fragment<T, R> {
  return {
    __type: 'fragment',
    __key: key,
    __deps: deps,
    extract
  }
}

// ───────────────────────────────────────────────
// useFragment — Sauron‑native rewrite
// No hookSystem, no useSignal, no reactivity
// Pure compute-on-render fragment extraction
// ───────────────────────────────────────────────

export function useFragment<T, R>(
  fragment: Fragment<T, R>,
  data: T | undefined,
  __sauron_id__ = _sid()
): R | undefined {
  return createHook(
    'useFragment',
    __sauron_id__,

    // initializer
    (): HookState => ({
      value: {
        fragment,
        data
      }
    }),

    // updater
    (hook) => {
      if (hook.value.data === undefined) return undefined
      return hook.value.fragment.extract(hook.value.data)
    }
  )
}

// ───────────────────────────────────────────────
// composeFragments — unchanged
// ───────────────────────────────────────────────

export function composeFragments<T extends Record<string, any>>(
  fragments: { [K in keyof T]: Fragment<any, T[K]> }
): Fragment<any, T> {
  const deps = Object.values(fragments).flatMap(f => f.__deps)

  return createFragment(
    'composed',
    (data: any) => {
      const result: any = {}
      for (const [key, fragment] of Object.entries(fragments)) {
        result[key] = fragment.extract(data)
      }
      return result
    },
    deps
  )
}
