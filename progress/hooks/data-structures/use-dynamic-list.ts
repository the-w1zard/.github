import { _sid, createHook, HookState, notifyHook } from '#the-cloud'

export function useDynamicList(initialList: any[] = [], __sauron_id__ = _sid()) {
  return createHook(
    'useDynamicList',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => ({
      value: [...initialList]
    }),

    // ───────────────────────────────────────── updater
    (hook, key) => {
      const setList = (updater: any) => {
        const next =
          typeof updater === 'function'
            ? updater(hook.value)
            : updater

        hook.value = next
        notifyHook(key)
      }

      const getList = () => hook.value

      const push = (item: any) =>
        setList((prev: any[]) => [...prev, item])

      const pop = () =>
        setList((prev: any[]) => {
          const next = [...prev]
          next.pop()
          return next
        })

      const insert = (index: number, item: any) =>
        setList((prev: any[]) => [
          ...prev.slice(0, index),
          item,
          ...prev.slice(index)
        ])

      const remove = (index: number) =>
        setList((prev: any[]) => prev.filter((_, i) => i !== index))

      const move = (from: number, to: number) =>
        setList((prev: any[]) => {
          const next = [...prev]
          const [item] = next.splice(from, 1)
          next.splice(to, 0, item)
          return next
        })

      const merge = (index: number, items: any[]) =>
        setList((prev: any[]) => [
          ...prev.slice(0, index),
          ...items,
          ...prev.slice(index)
        ])

      const replace = (index: number, item: any) =>
        setList((prev: any[]) =>
          prev.map((old, i) => (i === index ? item : old))
        )

      const getKey = (index: number) =>
        `${index}_${hook.value[index]}`

      return [
        hook.value,
        { push, pop, insert, remove, move, merge, replace, getKey },
        getList
      ]
    }
  )
}
