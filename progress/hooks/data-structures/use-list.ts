import { _sid, createHook, HookState, notifyHook } from '#the-cloud'

// ───────────────────────────────────────────────
// useList — Sauron‑native rewrite
// No React, no useState, no useEffect, no hookSystem
// Pure deterministic list state with stable ops
// ───────────────────────────────────────────────

export function useList<T = any>(
  initialList: T[] = [],
  __sauron_id__ = _sid()
) {
  return createHook(
    'useList',
    __sauron_id__,

    (): HookState => ({
      value: {
        list: [...initialList]
      }
    }),

    (hook, key) => {
      const s = hook.value

      const setList = (updater: (prev: T[]) => T[]) => {
        s.list = updater(s.list)
        notifyHook(key)
      }

      const getList = () => s.list

      const push = (item: T) =>
        setList((prev) => [...prev, item])

      const pop = () =>
        setList((prev) => {
          const next = [...prev]
          next.pop()
          return next
        })

      const unshift = (item: T) =>
        setList((prev) => [item, ...prev])

      const shift = () =>
        setList((prev) => {
          const next = [...prev]
          next.shift()
          return next
        })

      const removeAt = (index: number) =>
        setList((prev) => prev.filter((_, i) => i !== index))

      const insertAt = (index: number, item: T) =>
        setList((prev) => [
          ...prev.slice(0, index),
          item,
          ...prev.slice(index)
        ])

      const updateAt = (index: number, item: T) =>
        setList((prev) =>
          prev.map((old, i) => (i === index ? item : old))
        )

      const clear = () => setList(() => [])

      return [
        s.list,
        { push, pop, unshift, shift, removeAt, insertAt, updateAt, clear },
        getList
      ]
    }
  )
}
