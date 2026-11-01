import { createHook } from '#the-cloud'

export function useSet<T>(
  initialSet: Set<T> = new Set(),
  __sauron_id__ = _sid()
) {
  return createHook(
    "useSet",
    __sauron_id__,

    () => ({
      value: {
        set: initialSet
      }
    }),

    (state, key, notify) => {
      const s = state.value

      const add = (item: T) => {
        const next = new Set(s.set)
        next.add(item)
        s.set = next
        notify(key)
      }

      const remove = (item: T) => {
        const next = new Set(s.set)
        next.delete(item)
        s.set = next
        notify(key)
      }

      const toggle = (item: T) => {
        const next = new Set(s.set)
        if (next.has(item)) next.delete(item)
        else next.add(item)
        s.set = next
        notify(key)
      }

      const has = (item: T) => s.set.has(item)

      const clear = () => {
        s.set = new Set()
        notify(key)
      }

      const getSet = () => s.set

      return [
        s.set,
        { add, remove, toggle, has, clear },
        getSet
      ] as const
    }
  )
}
