import { createHook } from '#the-cloud'

interface StagedState<T extends object> {
  baseState: T
  staged: Partial<T>
  subscribers: Set<() => void>
}

export function useStaged<T extends object>(
  initialState: T | (() => T),
  __sauron_id__ = _sid()
) {
  return createHook(
    "useStaged",
    __sauron_id__,

    () => {
      const base =
        typeof initialState === "function"
          ? (initialState as () => T)()
          : { ...initialState }

      return {
        value: {
          baseState: base,
          staged: {},
          subscribers: new Set<() => void>()
        } as StagedState<T>
      }
    },

    (state, key, notify) => {
      const s = state.value

      const getState = () => ({
        ...s.baseState,
        ...s.staged
      })

      const getStaged = () => ({ ...s.staged })

      const stage = (
        changes: Partial<T> | ((current: T) => Partial<T>)
      ) => {
        const current = getState()
        const next =
          typeof changes === "function"
            ? (changes as (c: T) => Partial<T>)(current)
            : changes

        Object.assign(s.staged, next)
        s.subscribers.forEach((fn: () => void) => fn())
        notify(key)
      }

      const unstage = (keys?: (keyof T)[]) => {
        if (!keys) {
          for (const k in s.staged) delete s.staged[k]
        } else {
          keys.forEach((k: keyof T) => {
            delete s.staged[k]
          })
        }
        s.subscribers.forEach((fn: () => void) => fn())
        notify(key)
      }

      const commit = () => {
        Object.assign(s.baseState, s.staged)
        for (const k in s.staged) delete s.staged[k]
        s.subscribers.forEach((fn: () => void) => fn())
        notify(key)
      }

      const revert = () => {
        for (const k in s.staged) delete s.staged[k]
        s.subscribers.forEach((fn: () => void) => fn())
        notify(key)
      }

      const isStaged = (k: keyof T) => k in s.staged

      const diff = () => {
        const out: Array<{ key: keyof T; old: any; new: any }> = []
        for (const k of Object.keys(s.staged) as (keyof T)[]) {
          out.push({
            key: k,
            old: s.baseState[k],
            new: s.staged[k]
          })
        }
        return out
      }

      if (!state.cleanup) {
        const rerender = () => notify(key)
        s.subscribers.add(rerender)
        state.cleanup = () => {
          s.subscribers.delete(rerender)
        }
      }

      return {
        state: getState,
        staged: getStaged,
        stage,
        unstage,
        commit,
        revert,
        isStaged,
        diff
      }
    }
  )
}
