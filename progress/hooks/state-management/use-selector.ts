import { createHook } from '#the-cloud'
import { useAtom } from '#sauron'

export function useSelector(
  atomId: string,
  selector: (value: any) => any,
  __sauron_id__ = _sid()
) {
  const [atomValue] = useAtom(atomId)

  return createHook(
    "useSelector",
    __sauron_id__,

    () => ({
      value: {
        atomId,
        selector,
        value: selector(atomValue),
        lastAtomValue: atomValue
      }
    }),

    (state, key, notify) => {
      const s = state.value

      const depsChanged =
        s.atomId !== atomId ||
        s.selector !== selector ||
        s.lastAtomValue !== atomValue

      if (depsChanged) {
        s.value = selector(atomValue)
        s.atomId = atomId
        s.selector = selector
        s.lastAtomValue = atomValue
        notify(key)
      }

      return [s.value] as const
    }
  )
}
